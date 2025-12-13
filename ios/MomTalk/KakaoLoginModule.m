#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(KakaoLoginModule, NSObject)

RCT_EXTERN_METHOD(
  login:(RCTPromiseResolveBlock)resolve
  rejecter:(RCTPromiseRejectBlock)reject
)

@end
