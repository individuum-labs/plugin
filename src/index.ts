import config_json from "../config.json";
import {
  redirect,
  notarize,
  outputJSON,
  getCookiesByHost,
  getHeadersByHost,
} from "./utils/hf.js";

/**
 * Plugin configuration
 * This configurations defines the plugin, most importantly:
 *  * the different steps
 *  * the user data (headers, cookies) it will access
 *  * the web requests it will query (or notarize)
 */
export function config() {
  outputJSON({
    ...config_json,
  });
}

function isValidHost(urlString: string) {
  const url = new URL(urlString);
  return url.hostname === "twitter.com" || url.hostname === "x.com";
}

export function start() {
  if (!isValidHost(Config.get("tabUrl"))) {
    redirect("https://x.com");
    outputJSON(false);
    return;
  }
  outputJSON(true);
}

/**
 * Implementation of step "two".
 * This step collects and validates authentication cookies and headers for 'api.x.com'.
 * If all required information, it creates the request object.
 * Note that the url needs to be specified in the `config` too, otherwise the request will be refused.
 */
export function query_account() {
  const cookies = getCookiesByHost("api.x.com");
  const headers = getHeadersByHost("api.x.com");

  if (
    !cookies.auth_token ||
    !cookies.ct0 ||
    !headers["x-csrf-token"] ||
    !headers["authorization"]
  ) {
    outputJSON(false);
    return;
  }

  outputJSON({
    url: "https://api.x.com/1.1/account/settings.json",
    method: "GET",
    headers: {
      "x-twitter-client-language": "en",
      "x-csrf-token": headers["x-csrf-token"],
      Host: "api.x.com",
      authorization: headers.authorization,
      Cookie: `lang=en; auth_token=${cookies.auth_token}; ct0=${cookies.ct0}`,
      "Accept-Encoding": "identity",
      Connection: "close",
    },
    secretHeaders: [
      `x-csrf-token: ${headers["x-csrf-token"]}`,
      `cookie: lang=en; auth_token=${cookies.auth_token}; ct0=${cookies.ct0}`,
      `authorization: ${headers.authorization}`,
    ],
  });
}

/**
 * This method is used to parse the Twitter response and specify what information is revealed (i.e. **not** redacted)
 * This method is optional in the notarization request. When it is not specified nothing is redacted.
 *
 * In this example it locates the `screen_name` and excludes that range from the revealed response.
 */
export function parse_account() {
  const bodyString = Host.inputString();
  const params = JSON.parse(bodyString);

  if (params.screen_name) {
    const revealed = `"screen_name":"${params.screen_name}"`;
    const selectionStart = bodyString.indexOf(revealed);
    const selectionEnd = selectionStart + revealed.length;
    const secretResps = [
      bodyString.substring(0, selectionStart),
      bodyString.substring(selectionEnd, bodyString.length),
    ];
    outputJSON(secretResps);
  } else {
    outputJSON(false);
  }
}

/**
 * Step 3: calls the `notarize` host function
 */
export function notarize_account() {
  const params = JSON.parse(Host.inputString());

  if (!params) {
    outputJSON(false);
  } else {
    const id = notarize({
      ...params,
      getSecretResponse: "parse_account",
    });
    outputJSON(id);
  }
}

export function query_tweet() {
  const cookies = getCookiesByHost("x.com");
  const headers = getHeadersByHost("x.com");
  if (
    !cookies.auth_token ||
    !cookies.ct0 ||
    !headers["x-csrf-token"] ||
    !headers["authorization"]
  ) {
    outputJSON(false);
    return;
  }
  const regex = /^https:\/\/(?:x|twitter).com\/\w+\/status\/(\d+)/gm;
  outputJSON({
    url: `https://x.com/i/api/graphql/QVo2zKMcLZjXABtcYpi0mA/TweetDetail?variables=${encodeURIComponent(
      JSON.stringify({
        focalTweetId: regex.exec(Config.get("tabUrl"))[1],
        with_rux_injections: false,
        includePromotedContent: true,
        withCommunity: true,
        withQuickPromoteEligibilityTweetFields: true,
        withBirdwatchNotes: true,
        withVoice: true,
      })
    )}&features=${encodeURIComponent(
      JSON.stringify({
        rweb_tipjar_consumption_enabled: true,
        responsive_web_graphql_exclude_directive_enabled: true,
        verified_phone_label_enabled: false,
        creator_subscriptions_tweet_preview_api_enabled: true,
        responsive_web_graphql_timeline_navigation_enabled: true,
        responsive_web_graphql_skip_user_profile_image_extensions_enabled:
          false,
        communities_web_enable_tweet_community_results_fetch: true,
        c9s_tweet_anatomy_moderator_badge_enabled: true,
        articles_preview_enabled: true,
        tweetypie_unmention_optimization_enabled: true,
        responsive_web_edit_tweet_api_enabled: true,
        graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
        view_counts_everywhere_api_enabled: true,
        longform_notetweets_consumption_enabled: true,
        responsive_web_twitter_article_tweet_consumption_enabled: true,
        tweet_awards_web_tipping_enabled: false,
        creator_subscriptions_quote_tweet_preview_enabled: false,
        freedom_of_speech_not_reach_fetch_enabled: true,
        standardized_nudges_misinfo: true,
        tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled:
          true,
        rweb_video_timestamps_enabled: true,
        longform_notetweets_rich_text_read_enabled: true,
        longform_notetweets_inline_media_enabled: true,
        responsive_web_enhance_cards_enabled: false,
      })
    )}&fieldToggles=${encodeURIComponent(
      JSON.stringify({
        withArticleRichContentState: true,
        withArticlePlainText: false,
        withGrokAnalyze: false,
      })
    )}`,
    method: "GET",
    headers: {
      "x-twitter-client-language": "en",
      "x-csrf-token": headers["x-csrf-token"],
      Host: "x.com",
      authorization: headers.authorization,
      Cookie: `lang=en; auth_token=${cookies.auth_token}; ct0=${cookies.ct0}`,
      "Accept-Encoding": "identity",
      Connection: "close",
    },
    secretHeaders: [
      `x-csrf-token: ${headers["x-csrf-token"]}`,
      `cookie: lang=en; auth_token=${cookies.auth_token}; ct0=${cookies.ct0}`,
      `authorization: ${headers.authorization}`,
    ],
  });
}

export function notarize_tweet() {
  const params = JSON.parse(Host.inputString());
  const id = notarize({
    ...params,
  });
  outputJSON(id);
}
