import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import navigators and screens
import TabNavigator from './TabNavigator';
import SplashScreen from '../screens/SplashScreen';
import AuthScreen from '../screens/AuthScreen';
import AddPlantScreen from '../screens/AddPlantScreen';
import PlantDetailScreen from '../screens/PlantDetailScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import MyPostsScreen from '../screens/MyPostsScreen';
import EditPostScreen from '../screens/EditPostScreen';
import EditPlantScreen from '../screens/EditPlantScreen';
import QRScannerScreen from '../screens/QRScannerScreen';

// Community screens
import UserProfileScreen from '../screens/UserProfileScreen';
import ChatScreen from '../screens/ChatScreen';
import ConversationsScreen from '../screens/ConversationsScreen';
import FriendsScreen from '../screens/FriendsScreen';
import SharePlantScreen from '../screens/SharePlantScreen';

// Group screens
import GroupsScreen from '../screens/GroupsScreen';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import GroupChatScreen from '../screens/GroupChatScreen';
import GroupDetailsScreen from '../screens/GroupDetailsScreen';

// Import theme and utilities
import { colors } from '../theme/colors';
import { getGestureConfig } from '../utils/gestureUtils';
import { useAppContext } from '../context/AppContext';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const navigationRef = useRef(null);
  const { isAuthenticated } = useAppContext();

  console.log('🧭 AppNavigator render - isAuthenticated:', isAuthenticated);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.botanical.base,
            borderBottomWidth: 1,
            borderBottomColor: colors.ui.border,
            shadowColor: colors.botanical.dark,
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 4,
          },
          headerTitleStyle: {
            color: colors.botanical.dark,
            fontSize: 18,
            fontWeight: 'bold',
          },
          headerTintColor: colors.botanical.dark,
          cardStyle: {
            backgroundColor: colors.botanical.base,
          },
          // Enable native gestures for both platforms
          ...getGestureConfig(),
        }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen 
              name="Splash" 
              component={SplashScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="Auth" 
              component={AuthScreen}
              options={{
                headerShown: false,
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen 
              name="MainApp" 
              component={TabNavigator}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="AddPlant" 
              component={AddPlantScreen}
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="PlantDetail" 
              component={PlantDetailScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="PostDetail" 
              component={PostDetailScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="CreatePost" 
              component={CreatePostScreen}
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="QRScanner" 
              component={QRScannerScreen}
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="MyPosts" 
              component={MyPostsScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="EditPost" 
              component={EditPostScreen}
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="EditPlant" 
              component={EditPlantScreen}
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="UserProfile" 
              component={UserProfileScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="Chat" 
              component={ChatScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="Conversations" 
              component={ConversationsScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="Friends" 
              component={FriendsScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="SharePlant" 
              component={SharePlantScreen}
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />
            {/* Group screens */}
            <Stack.Screen 
              name="Groups" 
              component={GroupsScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="CreateGroup" 
              component={CreateGroupScreen}
              options={{
                headerShown: false,
                presentation: 'modal',
              }}
            />
            <Stack.Screen 
              name="GroupChat" 
              component={GroupChatScreen}
              options={{
                headerShown: false,
              }}
            />
            <Stack.Screen 
              name="GroupDetails" 
              component={GroupDetailsScreen}
              options={{
                headerShown: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;