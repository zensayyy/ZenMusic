import store, {RootState} from '../../states/Store';
import {APIKEY} from '../constants';
import {
  HttpProviderCommon,
  pickGuard,
  ProviderContext,
} from '../ProviderCommon';

const endpointUrl = `https://music.youtube.com/youtubei/v1/browse?key=${APIKEY}&prettyPrint=false`;

const defaultEndpointPayload = {
  browsId: 'FEmusic_home',
  context: {
    client: {
      clientName: 'WEB_REMIX',
      clientVersion: '1.20221128.01.00',
    },
  },
};

const providerCommon = new HttpProviderCommon(endpointUrl);

export interface ItemAction {
  action: 'browse' | 'watch';
  browseId: String;
  watchId: String;
  playlistId: String;
}

export interface Item {
  displayType: 'max' | 'compact';
  artworkUrl: String;
  title: String;
  subtitle: String;
  action: ItemAction;
}

export interface MusicShelf {
  title: String;
  renderStyle: 'scroll' | 'stack';
  msItem: Item[];
}

function pickMSTitle(obj: any): String {
  const runs: any[] | null = pickGuard(
    obj,
    [
      'musicCarouselShelfRenderer',
      'header',
      'musicCarouselShelfBasicHeaderRenderer',
      'title',
      'runs',
    ],
    Array.isArray,
  );
  if (runs) {
    return runs[0].text;
  }
  return '';
}

function pickMSRenderStyle(itemList: any[]): 'scroll' | 'stack' {
  if ('musicResponsiveListItemRenderer' in itemList[0]) {
    return 'stack';
  }
  return 'scroll';
}

function pickMSAction(item: any): ItemAction {
  const actionType = (() => {
    const videoType =
      pickGuard(
        item,
        ['musicTwoRowItemRenderer', 'navigationEndpoint', 'watchEndpoint'],
        _i => true,
      ) || pickGuard(item, ['musicResponsiveListItemRenderer'], _i => true);
    if (videoType) {
      return 'watch';
    }
    return 'browse';
  })();
  const pickWatchId = (it: any) => {
    if (it.musicResponsiveListItemRenderer !== undefined) {
      const flex: any[] | null = pickGuard(
        it,
        ['musicResponsiveListItemRenderer', 'flexColumns'],
        Array.isArray,
      );
      if (!flex) {
        return '';
      }
      const runs: any[] | null = pickGuard(
        flex[0],
        ['musicResponsiveListItemFlexColumnRenderer', 'text', 'runs'],
        Array.isArray,
      );
      if (!runs) {
        return '';
      }
      const endpoint: String =
        pickGuard(
          runs[0],
          ['navigationEndpoint', 'watchEndpoint', 'videoId'],
          e => {
            return typeof e === 'string' || e instanceof String;
          },
        ) || '';
      return endpoint;
    }
    if (item.musicTwoRowItemRenderer !== undefined) {
      const endpoint: String =
        pickGuard(
          it,
          [
            'musicTwoRowItemRenderer',
            'navigationEndpoint',
            'watchEndpoint',
            'videoId',
          ],
          e => {
            return typeof e === 'string' || e instanceof String;
          },
        ) || '';
      return endpoint;
    }
    return '';
  };

  const action: ItemAction = {
    action: actionType,
    browseId:
      actionType === 'browse'
        ? (
            pickGuard(
              item,
              [
                'musicTwoRowItemRenderer',
                'navigationEndpoint',
                'browseEndpoint',
                'browseId',
              ],
              i => {
                return typeof i === 'string' || i instanceof String;
              },
            ) as String
          ).slice(2) || ('' as String)
        : ('' as String),
    watchId: actionType === 'watch' ? pickWatchId(item) : ('' as String),
    playlistId: '',
  };
  return action;
}

function pickMSItemList(itemList: any[]): Item[] {
  const parsedItems: Item[] = [];
  for (const item of itemList) {
    if (item.musicResponsiveListItemRenderer !== undefined) {
      // display stacked,
      const thisItem: Item = {
        displayType: 'compact',
        title: (() => {
          const flex: any[] | null = pickGuard(
            item,
            ['musicResponsiveListItemRenderer', 'flexColumns'],
            Array.isArray,
          );
          if (!flex) {
            return '' as String;
          }
          const runs: any[] | null = pickGuard(
            flex[0],
            ['musicResponsiveListItemFlexColumnRenderer', 'text', 'runs'],
            Array.isArray,
          );
          if (!runs) {
            return '' as String;
          }
          return runs[0].text as String;
        })(),
        subtitle: (() => {
          const flex: any[] | null = pickGuard(
            item,
            ['musicResponsiveListItemRenderer', 'flexColumns'],
            Array.isArray,
          );
          if (!flex) {
            return '' as String;
          }
          return flex
            .slice(1)
            .map(it => {
              const runs: any[] | null = pickGuard(
                it,
                ['musicResponsiveListItemFlexColumnRenderer', 'text', 'runs'],
                Array.isArray,
              );
              if (!runs) {
                return '';
              }
              return runs[0].text;
            })
            .join(' ') as String;
        })(),
        artworkUrl: (() => {
          const art: any[] | null = pickGuard(
            item,
            [
              'musicResponsiveListItemRenderer',
              'thumbnail',
              'musicThumbnailRenderer',
              'thumbnail',
              'thumbnails',
            ],
            Array.isArray,
          );
          if (!art) {
            return '' as String;
          }
          return art[0].url as String;
        })(),
        action: pickMSAction(item),
      };
      parsedItems.push(thisItem);
    }
    if (item.musicTwoRowItemRenderer !== undefined) {
      const thisItem: Item = {
        displayType: 'compact',
        title: (() => {
          const runs: any[] | null = pickGuard(
            item,
            ['musicTwoRowItemRenderer', 'title', 'runs'],
            Array.isArray,
          );
          if (!runs) {
            return '' as String;
          }
          return runs[0].text as String;
        })(),
        subtitle: (() => {
          const runs: any[] | null = pickGuard(
            item,
            ['musicTwoRowItemRenderer', 'subtitle', 'runs'],
            Array.isArray,
          );
          if (!runs) {
            return '' as String;
          }
          return runs.map(it => it.text).join(' ') as String;
        })(),
        artworkUrl: (() => {
          const arts: any[] | null = pickGuard(
            item,
            [
              'musicTwoRowItemRenderer',
              'thumbnailRenderer',
              'musicThumbnailRenderer',
              'thumbnail',
              'thumbnails',
            ],
            Array.isArray,
          );
          if (!arts) {
            return '' as String;
          }
          return arts[0].url as String;
        })(),
        action: pickMSAction(item),
      };
      parsedItems.push(thisItem);
    }
  }

  return parsedItems;
}

function pickContinuationToken(obj: any): String {
  const cShelf: any[] =
    pickGuard(
      obj,
      ['continuationContents', 'sectionListContinuation', 'continuations'],
      Array.isArray,
    ) || [];
  const ctoken: String | null = pickGuard(
    cShelf[0],
    ['nextContinuationData', 'continuation'],
    e => typeof e === 'string' || e instanceof String,
  );

  const sShelf: any[] =
    pickGuard(
      obj,
      ['tabRenderer', 'content', 'sectionListRenderer', 'continuations'],
      Array.isArray,
    ) || [];
  const stoken: String | null = pickGuard(
    sShelf[0],
    ['nextContinuationData', 'continuation'],
    e => typeof e === 'string' || e instanceof String,
  );
  return stoken || ctoken || '';
}

export default {
  async fetch(): Promise<MusicShelf[]> {
    const state: RootState = store.getState();
    const ctx: ProviderContext = {
      cookie: state.session.cookieHeader,
      sapisid: state.session.SAPISID,
      payload: JSON.stringify(defaultEndpointPayload),
    };

    const obj = await providerCommon.fetchEndPoint(ctx);
    const newShelf: any[] | null = pickGuard(
      obj,
      ['contents', 'singleColumnBrowseResultsRenderer', 'tabs'],
      Array.isArray,
    );

    const continuationShelf: any[] | null = pickGuard(
      obj,
      ['continuationContents', 'sectionListContinuation', 'contents'],
      Array.isArray,
    );

    const musicShelfList: MusicShelf[] = [];
    if (continuationShelf) {
      for (const content of continuationShelf) {
        const itemList: any[] | null = pickGuard(
          content,
          ['musicCarouselShelfRenderer', 'contents'],
          Array.isArray,
        );
        if (itemList) {
          const musicShelf: MusicShelf = {
            title: pickMSTitle(content),
            renderStyle: pickMSRenderStyle(itemList),
            msItem: pickMSItemList(itemList),
          };
          musicShelfList.push(musicShelf);
        }
      }
      const continuation = pickContinuationToken(obj);
      providerCommon.updateEnpoint('ctoken', continuation);
      providerCommon.updateEnpoint('continuation', continuation);
      providerCommon.updateEnpoint('type', 'next');
    } else if (newShelf) {
      const contents: any[] | null = pickGuard(
        newShelf[0],
        ['tabRenderer', 'content', 'sectionListRenderer', 'contents'],
        Array.isArray,
      );
      if (contents) {
        for (const content of contents) {
          const itemList: any[] | null = pickGuard(
            content,
            ['musicCarouselShelfRenderer', 'contents'],
            Array.isArray,
          );
          if (itemList) {
            const musicShelf: MusicShelf = {
              title: pickMSTitle(content),
              renderStyle: pickMSRenderStyle(itemList),
              msItem: pickMSItemList(itemList),
            };
            musicShelfList.push(musicShelf);
          }
        }
      }
      const continuation = pickContinuationToken(newShelf[0]);
      providerCommon.updateEnpoint('ctoken', continuation);
      providerCommon.updateEnpoint('continuation', continuation);
      providerCommon.updateEnpoint('type', 'next');
    }
    return musicShelfList;
  },
};
