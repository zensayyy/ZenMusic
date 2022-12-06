import { Slider } from "@miblanchard/react-native-slider";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import TrackPlayer from "react-native-track-player";
import Icon from 'react-native-vector-icons/Ionicons';

export interface PlayerControlsProps {
  videoId: String
}

enum playbackControlsActions {
  ActionPlay,
  ActionPause
}

const playbackControls = (controls: playbackControlsActions) => {
  switch (controls) {
    case playbackControlsActions.ActionPlay:
      (async () => TrackPlayer.play())();
      break;
    case playbackControlsActions.ActionPause:
      (async () => TrackPlayer.pause())();
      break;
  }
}

export default function PlayerControls({ videoId }: PlayerControlsProps) {
  const [playState, setPlayState] = useState(false);
  return (
    <View className="w-full w-full flex flex-col items-center">
      <View className="w-[90%] items-stretch">
        <Slider value={20}
          trackStyle={{
            backgroundColor: "white"
          }} />
      </View>
      <View className="w-[90%] flex flex-row justify-between">
        <TouchableOpacity>
          <Icon name="ios-repeat" size={24} color="white" />
        </TouchableOpacity>
        <View className="mt-8 flex flex-row gap-2">
          <TouchableOpacity>
            <Icon name="play-skip-back-sharp" size={36} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {

            playbackControls(playState ? playbackControlsActions.ActionPause : playbackControlsActions.ActionPlay);
            setPlayState(!playState);
          }}>
            {playState ? (
              <Icon name="pause" size={42} color="white" />
            ) : (
              <Icon name="play" size={42} color="white" />
            )}
          </TouchableOpacity>
          <TouchableOpacity>
            <Icon name="play-skip-forward-sharp" size={36} color="white" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity>
          <Icon name="add-sharp" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  )

}
