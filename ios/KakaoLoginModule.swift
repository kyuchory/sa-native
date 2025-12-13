import Foundation
import KakaoSDKAuth
import KakaoSDKUser

@objc(KakaoLoginModule)
class KakaoLoginModule: NSObject {

  @objc(login:rejecter:)
  func login(
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {

    if UserApi.isKakaoTalkLoginAvailable() {
      UserApi.shared.loginWithKakaoTalk { token, error in
        self.handleResult(token, error, resolve, reject)
      }
    } else {
      UserApi.shared.loginWithKakaoAccount { token, error in
        self.handleResult(token, error, resolve, reject)
      }
    }
  }

  private func handleResult(
    _ token: OAuthToken?,
    _ error: Error?,
    _ resolve: RCTPromiseResolveBlock,
    _ reject: RCTPromiseRejectBlock
  ) {
    if let error = error {
      reject("LOGIN_FAILED", error.localizedDescription, error)
      return
    }

    guard let token = token else {
      reject("NO_TOKEN", "Token is nil", nil)
      return
    }

    resolve([
      "accessToken": token.accessToken,
      "refreshToken": token.refreshToken,
      "expiredAt": token.expiredAt.timeIntervalSince1970,
      "refreshTokenExpiredAt": token.refreshTokenExpiredAt.timeIntervalSince1970
    ])
  }

  @objc
  static func requiresMainQueueSetup() -> Bool {
    true
  }
}
