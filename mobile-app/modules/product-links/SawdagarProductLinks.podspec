Pod::Spec.new do |s|
  s.name = 'SawdagarProductLinks'
  s.version = '1.0.0'
  s.summary = 'Sawdagar product link recovery'
  s.homepage = 'https://sawdagar.com'
  s.license = 'MIT'
  s.author = 'Sawdagar'
  s.source = { :git => 'https://sawdagar.com', :tag => s.version.to_s }
  s.platforms = { :ios => '15.1' }
  s.source_files = 'ios/*.{h,m,mm}'
  s.dependency 'React-Core'
end
