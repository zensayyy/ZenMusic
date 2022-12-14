import React from 'react';
import {FlatList, View} from 'react-native';
import {Item} from '../../../common/Providers/MusicShelfProvider';
import GenericCard from './GenericCard';

export interface ShelfRendererProps {
  shelf: Item[];
  renderStyle: 'scroll' | 'stack';
}

function splitArray(array: any[], i: number): any[] {
  return array.reduce((result, item, index) => {
    if (index % i === 0) {
      result.push([item]);
    } else {
      result[result.length - 1].push(item);
    }
    return result;
  }, []);
}

export default function ShelfRenderer({
  shelf,
  renderStyle,
}: ShelfRendererProps) {
  if (renderStyle === 'scroll') {
    return (
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={shelf}
        keyExtractor={(item, _index) => `${item.title}+${item.subtitle}`}
        renderItem={({item}) => {
          return <GenericCard item={item} />;
        }}
        ItemSeparatorComponent={() => <View className="w-4" />}
      />
    );
  } else if (renderStyle === 'stack') {
    const stackedShelf = splitArray(shelf, 4);
    return (
      <FlatList
        style={{zIndex: 9}}
        horizontal
        showsHorizontalScrollIndicator={false}
        data={stackedShelf}
        keyExtractor={(item, _index) => {
          return item
            .map((value: Item) => {
              return value.title;
            })
            .join('.');
        }}
        renderItem={({item}) => {
          return (
            <View>
              {item.map((value: Item) => {
                return (
                  <GenericCard
                    key={value.artworkUrl as string}
                    item={value}
                    mini={true}
                  />
                );
              })}
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View className="w-8" />}
      />
    );
  }
  return <></>;
}
