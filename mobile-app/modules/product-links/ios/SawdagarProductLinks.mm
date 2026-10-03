#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>

@interface SawdagarProductLinks : NSObject <RCTBridgeModule>
@end

@implementation SawdagarProductLinks
RCT_EXPORT_MODULE();
+ (BOOL)requiresMainQueueSetup { return YES; }
- (dispatch_queue_t)methodQueue { return dispatch_get_main_queue(); }

// A type-presence check, not a clipboard read. Only the explicit Paste action
// below accesses content; iOS may also present its system paste permission.
RCT_REMAP_METHOD(hasPasteCandidate, hasPasteCandidateWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  resolve(@(UIPasteboard.generalPasteboard.hasStrings || UIPasteboard.generalPasteboard.hasURLs));
}
RCT_REMAP_METHOD(pasteProductLink, pasteProductLinkWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject) {
  UIPasteboard *board = UIPasteboard.generalPasteboard;
  NSString *text = board.string ?: board.URL.absoluteString;
  resolve(text ?: (id)kCFNull);
}
@end
