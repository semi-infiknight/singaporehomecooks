#import "AppDelegate.h"

#import <React/RCTBundleURLProvider.h>
#import <React/RCTLinkingManager.h>

static NSURL *SHCCookNormalizeMetroURL(NSURL *url)
{
  if (url == nil) {
    return nil;
  }
  NSString *absolute = url.absoluteString;
  if ([absolute containsString:@":8081"]) {
    return [NSURL URLWithString:[absolute stringByReplacingOccurrencesOfString:@":8081" withString:@":8082"]];
  }
  return url;
}

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  self.moduleName = @"main";

  // You can add your custom initial props in the dictionary below.
  // They will be passed down to the ViewController used by React Native.
  self.initialProps = @{};

#if DEBUG
  // Keep HMR / dev tooling on cook Metro (expo run:ios deep links default to :8081).
  [[RCTBundleURLProvider sharedSettings] setJsLocation:@"127.0.0.1"];
#endif

  NSMutableDictionary *normalizedLaunchOptions = launchOptions ? [launchOptions mutableCopy] : nil;
  NSURL *launchURL = launchOptions[UIApplicationLaunchOptionsURLKey];
  NSURL *normalizedLaunchURL = SHCCookNormalizeMetroURL(launchURL);
  if (normalizedLaunchURL != nil && ![normalizedLaunchURL isEqual:launchURL]) {
    normalizedLaunchOptions[UIApplicationLaunchOptionsURLKey] = normalizedLaunchURL;
  }

  return [super application:application didFinishLaunchingWithOptions:normalizedLaunchOptions ?: launchOptions];
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
  return [self bundleURL];
}

- (NSURL *)bundleURL
{
#if DEBUG
  // Cook app shares monorepo with customer; Metro runs on 8082 (customer uses 8081).
  return [NSURL URLWithString:@"http://127.0.0.1:8082/.expo/.virtual-metro-entry.bundle?platform=ios&dev=true&minify=false"];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

// Linking API
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
  NSURL *normalizedURL = SHCCookNormalizeMetroURL(url);
  return [super application:application openURL:normalizedURL options:options] || [RCTLinkingManager application:application openURL:normalizedURL options:options];
}

// Universal Links
- (BOOL)application:(UIApplication *)application continueUserActivity:(nonnull NSUserActivity *)userActivity restorationHandler:(nonnull void (^)(NSArray<id<UIUserActivityRestoring>> * _Nullable))restorationHandler {
  BOOL result = [RCTLinkingManager application:application continueUserActivity:userActivity restorationHandler:restorationHandler];
  return [super application:application continueUserActivity:userActivity restorationHandler:restorationHandler] || result;
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken
{
  return [super application:application didRegisterForRemoteNotificationsWithDeviceToken:deviceToken];
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
  return [super application:application didFailToRegisterForRemoteNotificationsWithError:error];
}

// Explicitly define remote notification delegates to ensure compatibility with some third-party libraries
- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo fetchCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
  return [super application:application didReceiveRemoteNotification:userInfo fetchCompletionHandler:completionHandler];
}

@end
