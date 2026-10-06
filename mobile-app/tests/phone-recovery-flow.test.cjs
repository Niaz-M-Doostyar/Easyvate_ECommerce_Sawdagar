const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');

const forgotFile = path.join(__dirname, '../src/screens/auth/ForgotPasswordScreen.js');
const passwordFile = path.join(__dirname, '../src/screens/auth/NewPasswordScreen.js');

// Execute the real event handlers with mocked closure bindings. This checks
// requests, navigation, validation and single-flight behavior without loading
// a native renderer or contacting the SMS/password services.
const handlers = new Map();
function loadHandler(file, name, bindings) {
  const key = `${file}:${name}`;
  if (!handlers.has(key)) {
    const source = fs.readFileSync(file, 'utf8');
    const ast = babel.parseSync(source, { filename: file, configFile: false, babelrc: false, presets: ['module:@react-native/babel-preset'] });
    let expression;
    function visit(node) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'VariableDeclarator' && node.id?.name === name) expression = node.init;
      Object.values(node).forEach(value => Array.isArray(value) ? value.forEach(visit) : visit(value));
    }
    visit(ast);
    assert.ok(expression, `Missing event handler: ${name}`);
    const isolated = { type: 'File', program: { type: 'Program', sourceType: 'script', body: [{ type: 'ExpressionStatement', expression }] } };
    handlers.set(key, babel.transformFromAstSync(isolated, source, { configFile: false, babelrc: false }).code);
  }
  return vm.runInNewContext(handlers.get(key), bindings);
}

const plain = value => JSON.parse(JSON.stringify(value));
const copy = new Proxy({}, { get: (_, key) => String(key) });
function fixture() {
  const state = {}, calls = [], routes = [];
  const bindings = {
    Date, Number, Object, copy, busy: { current: false }, mounted: { current: true },
    navigation: { replace: (...args) => routes.push(plain(args)) },
    toast: { success: value => { state.notice = value; }, error: value => { state.errorNotice = value; } },
    setLoading: value => { state.loading = value; },
    setVerificationError: value => { state.verificationError = value; },
  };
  return { state, calls, routes, bindings };
}
function otpFixture() {
  const f = fixture();
  Object.assign(f.bindings, {
    challengeId: 'test-challenge', code: '123456', expiresAt: Date.now() + 300000, challengePhone: '+93700000000',
    authApi: { verifyPhoneResetOtp: async body => {
      f.calls.push(plain(body));
      return { challengeId: 'test-challenge', resetToken: 'test-proof', expiresIn: 600 };
    } },
  });
  return f;
}
function passwordFixture() {
  const f = fixture();
  Object.assign(f.bindings, {
    proofComplete: true, proofInvalid: false, deadline: Date.now() + 600000,
    challengeId: 'test-challenge', resetToken: 'test-proof', password: 'new-password', confirmPassword: 'new-password',
    setProofInvalid: value => { f.state.proofInvalid = value; },
    setErrors: value => { f.state.errors = plain(value); },
    setSubmitError: value => { f.state.submitError = value; },
    authApi: { resetPhonePassword: async body => { f.calls.push(plain(body)); return { message: 'Updated' }; } },
  });
  return f;
}

test('a correct six-digit OTP opens NewPassword without submitting a password', async () => {
  const f = otpFixture();
  const before = Date.now();
  await loadHandler(forgotFile, 'verifyCode', f.bindings)();
  assert.deepEqual(f.calls, [{ challengeId: 'test-challenge', code: '123456' }]);
  assert.equal(f.routes.length, 1);
  const [route, params] = f.routes[0];
  assert.equal(route, 'NewPassword');
  assert.equal(params.resetToken, 'test-proof');
  assert.equal(params.phone, '+93700000000');
  assert.ok(params.expiresAt >= before + 600000);
  assert.ok(params.expiresAt <= Date.now() + 600000);
  assert.equal(f.state.loading, false);
});

test('incorrect OTP stays on verification; incomplete, missing and expired codes make no request', async () => {
  const bad = otpFixture();
  bad.bindings.authApi.verifyPhoneResetOtp = async () => { throw new Error('Incorrect code'); };
  await loadHandler(forgotFile, 'verifyCode', bad.bindings)();
  assert.equal(bad.state.verificationError, 'Incorrect code');
  assert.equal(bad.routes.length, 0);
  assert.equal(bad.bindings.busy.current, false);
  for (const change of [{ code: '12345' }, { challengeId: '' }, { expiresAt: Date.now() - 1 }]) {
    const f = otpFixture(); Object.assign(f.bindings, change);
    await loadHandler(forgotFile, 'verifyCode', f.bindings)();
    assert.equal(f.calls.length, 0);
    assert.equal(f.routes.length, 0);
  }
});

test('auto-verification and manual action share one flight and settled rerenders do not repeat the code', async () => {
  const hookFile = path.join(__dirname, '../src/hooks/useAutoOtpVerification.js');
  const source = fs.readFileSync(hookFile, 'utf8');
  const code = babel.transformSync(source, { filename: hookFile, configFile: false, babelrc: false, presets: ['module:@react-native/babel-preset'] }).code;
  const refs = []; let cursor = 0; const effects = [];
  const react = { useRef: initial => refs[cursor++] || (refs[cursor - 1] = { current: initial }), useEffect: effect => effects.push(effect) };
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, require: name => { assert.equal(name, 'react'); return react; } });
  const render = props => { cursor = 0; effects.length = 0; module.exports.default(props); effects.forEach(effect => effect()); };
  const f = otpFixture(); let finish;
  f.bindings.authApi.verifyPhoneResetOtp = body => { f.calls.push(plain(body)); return new Promise(resolve => { finish = resolve; }); };
  const verify = loadHandler(forgotFile, 'verifyCode', f.bindings);
  const props = { challengeId: f.bindings.challengeId, code: f.bindings.code, loading: false, ready: true, onVerify: verify };
  render(props);
  await verify();
  render({ ...props, loading: true });
  assert.equal(f.calls.length, 1);
  finish({ challengeId: 'test-challenge', resetToken: 'test-proof', expiresIn: 600 });
  await new Promise(resolve => setImmediate(resolve));
  render(props);
  assert.equal(f.calls.length, 1);
  assert.equal(f.routes.length, 1);
});

test('password submission uses the proof and matching passwords, then returns to Login', async () => {
  const f = passwordFixture();
  await loadHandler(passwordFile, 'handleSave', f.bindings)();
  assert.deepEqual(f.calls, [{ challengeId: 'test-challenge', resetToken: 'test-proof', password: 'new-password', confirmPassword: 'new-password' }]);
  assert.deepEqual(f.routes, [['Login']]);
  assert.equal(f.state.notice, 'Updated');
});

test('missing, invalid or expired proof prevents password requests', async () => {
  for (const change of [{ proofComplete: false }, { proofInvalid: true }, { deadline: Date.now() - 1 }]) {
    const f = passwordFixture(); Object.assign(f.bindings, change);
    await loadHandler(passwordFile, 'handleSave', f.bindings)();
    assert.equal(f.calls.length, 0);
    assert.equal(f.routes.length, 0);
    assert.equal(f.state.proofInvalid, true);
  }
});

test('new passwords require 6–72 characters and a matching confirmation', async () => {
  for (const change of [{ password: '', confirmPassword: '' }, { password: 'short', confirmPassword: 'short' }, { password: 'x'.repeat(73), confirmPassword: 'x'.repeat(73) }, { confirmPassword: 'different' }]) {
    const f = passwordFixture(); Object.assign(f.bindings, change);
    await loadHandler(passwordFile, 'handleSave', f.bindings)();
    assert.equal(f.calls.length, 0);
    assert.ok(Object.keys(f.state.errors).length);
  }
  for (const length of [6, 72]) {
    const f = passwordFixture(); Object.assign(f.bindings, { password: 'x'.repeat(length), confirmPassword: 'x'.repeat(length) });
    await loadHandler(passwordFile, 'handleSave', f.bindings)();
    assert.equal(f.calls.length, 1);
  }
});

test('consumed/expired proof requires a new code; ordinary validation errors preserve the form', async () => {
  const f = passwordFixture();
  f.bindings.authApi.resetPhonePassword = async () => { const error = new Error('Expired'); error.status = 400; error.data = { code: 'RESET_PROOF_INVALID' }; throw error; };
  await loadHandler(passwordFile, 'handleSave', f.bindings)();
  assert.equal(f.state.proofInvalid, true);
  assert.equal(f.routes.length, 0);
  const validation = passwordFixture();
  validation.bindings.authApi.resetPhonePassword = async () => { const error = new Error('Invalid password'); error.status = 400; error.data = {}; throw error; };
  await loadHandler(passwordFile, 'handleSave', validation.bindings)();
  assert.equal(validation.state.proofInvalid, undefined);
  assert.equal(validation.state.submitError, 'Invalid password');
});

test('manual password saves are single-flight', async () => {
  const f = passwordFixture(); let finish;
  f.bindings.authApi.resetPhonePassword = body => { f.calls.push(plain(body)); return new Promise(resolve => { finish = resolve; }); };
  const save = loadHandler(passwordFile, 'handleSave', f.bindings);
  const saving = save(); await save();
  assert.equal(f.calls.length, 1);
  finish({ message: 'Updated' }); await saving;
  assert.equal(f.routes.length, 1);
});

test('legacy email reset still requests a normalized email link', async () => {
  const f = fixture();
  Object.assign(f.bindings, {
    identifier: '  Customer@Example.COM  ', useEmail: true, isPhone: false,
    setIdentifierError: value => { f.state.identifierError = value; }, setSent: value => { f.state.sent = value; },
    authApi: { forgotPassword: async body => f.calls.push(plain(body)) },
  });
  await loadHandler(forgotFile, 'handleSend', f.bindings)();
  assert.deepEqual(f.calls, [{ email: 'customer@example.com' }]);
  assert.equal(f.state.sent, true);
});
