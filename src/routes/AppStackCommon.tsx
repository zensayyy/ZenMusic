import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Player from '../pages/Player/Player';

const AppStackNav = createNativeStackNavigator();

export interface AppStackProps {
  main: React.FC<any>;
}

export default function AppStackCommon(props: AppStackProps) {
  return (
    <AppStackNav.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <AppStackNav.Screen name="MainPage" component={props.main} />
      <AppStackNav.Screen name="PlayerPage" component={Player} />
    </AppStackNav.Navigator>
  );
}