import { APIKEY } from "../common/apikey";
import { getAuthToken, getCookies, ReqContext } from "./general";
import { defaultReqPayloadContext, MusicCard, MusicShelf, ReqPayload } from "./types"

const apiEndpoint = "https://music.youtube.com/youtubei/v1/browse"

function parseVideoMusicCard(card: any): MusicCard | null {
  if ('musicTwoRowItemRenderer' in card) {
    try {
      const musicCard: MusicCard = {
        endpointType: 'video',
        displayType: 'full',
        title: card.musicTwoRowItemRenderer.title.runs[0].text,
        id: card.musicTwoRowItemRenderer.navigationEndpoint.watchEndpoint.videoId,
        subtitle: card.musicTwoRowItemRenderer.subtitle.runs.map((items) => items.text).join(" "), // more precise checks on this
        thumbnailUrl: card.musicTwoRowItemRenderer.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails[0].url,
      };
      return musicCard;
    } catch (e) {
      console.log(card.musicTwoRowItemRenderer)
      console.log("Failed to parse card ", e)
    }
  }
  if ('musicResponsiveListItemRenderer' in card) {
    // holy fucki this is uglyy
    try {

      const musicCard: MusicCard | null = {} as MusicCard;
      musicCard.endpointType = "video";
      musicCard.displayType = "flex";
      musicCard.title = card.musicResponsiveListItemRenderer
        .flexColumns[0].musicResponsiveListItemFlexColumnRenderer
        .text.runs[0].text;
      musicCard.id = card.musicResponsiveListItemRenderer
        .flexColumns[0].musicResponsiveListItemFlexColumnRenderer
        .text.runs[0].navigationEndpoint.watchEndpoint.videoId;
      musicCard.subtitle = card.musicResponsiveListItemRenderer
        .flexColumns.slice(1).map(
          (items) => items.musicResponsiveListItemFlexColumnRenderer.text.runs[0].text).join(" ");
      musicCard.thumbnailUrl = card.musicResponsiveListItemRenderer.thumbnail
        .musicThumbnailRenderer.thumbnail.thumbnails[0].url;
      return musicCard;
    } catch (e) {
      console.log("Failed to parse card ", e)
    }

  }
  return null;

}
function parseMusicCard(card: any, type: 'browse' | 'video'): MusicCard | null {
  if (type == 'browse') {
    try {
      const musicCard: MusicCard = {
        endpointType: 'browse',
        displayType: 'half',
        title: card.musicTwoRowItemRenderer.title.runs[0].text,
        id: card.musicTwoRowItemRenderer.navigationEndpoint.browseEndpoint.browseId,
        subtitle: card.musicTwoRowItemRenderer.subtitle.runs.map((items) => items.text).join(" "), // more precise checks on this
        thumbnailUrl: card.musicTwoRowItemRenderer.thumbnailRenderer.musicThumbnailRenderer.thumbnail.thumbnails[0].url,
      };
      return musicCard
    } catch (e) {
      console.log("Failed to parse card ", e)
    }
  }
  if (type == 'video') {
    return parseVideoMusicCard(card);
  }
  return null;
}

function touchMusicCardType(card: any): 'browse' | 'video' {
  // must be the stupidest way to do this ahha
  if (card.musicTwoRowItemRenderer !== undefined
    && card.musicTwoRowItemRenderer.navigationEndpoint !== undefined
    && card.musicTwoRowItemRenderer.navigationEndpoint.watchEndpoint !== undefined)
    return 'video';
  if (card.musicResponsiveListItemRenderer !== undefined)
    return 'video';
  // lOOOL 
  return 'browse';
}


async function internalFetch(ctx: ReqContext, req: ReqPayload): Promise<MusicShelf[] | null> {
  const response = await fetch(
    `${apiEndpoint}?key=${APIKEY}&prettyPrint=false`,
    {
      method: 'POST',
      headers: {
        'Referer': 'https://music.youtube.com',
        'Origin': 'https://music.youtube.com',
        'authorization': getAuthToken(ctx.cookies),
        'Cookie': getCookies(ctx.cookies),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req),
    }
  );
  try {
    const obj = await response.json();
    // interate over shelf objects
    let musicShelfs: MusicShelf[] = [];
    for (const shelf of obj.contents
      .singleColumnBrowseResultsRenderer
      .tabs[0]
      .tabRenderer
      .content
      .sectionListRenderer
      .contents) {
      let musicShelf: MusicShelf = {
        title: shelf.musicCarouselShelfRenderer
          .header
          .musicCarouselShelfBasicHeaderRenderer
          .title
          .runs[0]
          .text,
        cards: []
      };

      for (const card of shelf.musicCarouselShelfRenderer.contents) {
        const cardType = touchMusicCardType(card);
        const musicCard = parseMusicCard(card, cardType);
        if (musicCard)
          musicShelf.cards.push(musicCard);
      }
      musicShelfs.push(musicShelf);
    }
    return musicShelfs;
  } catch (error) {
    console.log("Failed to get browse ", error);
    return null;
  }
  return null;
}

export default {
  fetch(ctx: ReqContext, tab: String): Promise<MusicShelf[] | null> {
    let reqPayload: ReqPayload;
    switch (tab) {
      case "Home":
        reqPayload = {
          browseId: "FEmusic_home",
          context: defaultReqPayloadContext
        };
        break;
      case "Explore":
        reqPayload = {
          browseId: "FEmusic_explore",
          context: defaultReqPayloadContext
        };
        break;
      case "Library":
        reqPayload = {
          browseId: "FEmusic_liked_playlists",
          context: defaultReqPayloadContext
        };
        break;
      default:
        return new Promise(() => { return null; });
    }
    return internalFetch(ctx, reqPayload);
  },
}
