import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDeviceType } from '../utils/responsive';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import MyPlantsScreen from '../screens/MyPlantsScreen';
import CommunityScreen from '../screens/CommunityScreen';
import ProfileScreen from '../screens/ProfileScreen';

// Import theme
import { colors } from '../theme/colors';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { isTablet, hasNotch } = getDeviceType();

  // Calculate safe bottom padding - ensure enough space above Android nav buttons
  const getBottomPadding = () => {
    // On Android, always add extra padding to avoid system navigation
    if (Platform.OS === 'android') {
      // Use insets.bottom if available, otherwise use a safe default
      const androidNavHeight = Math.max(insets.bottom, 16);
      return androidNavHeight + 8; // Extra 8px buffer
    }
    // On iOS, use insets for notch devices
    return Math.max(insets.bottom, hasNotch ? 34 : 8);
  };

  const bottomPadding = getBottomPadding();
  const tabBarHeight = (isTablet ? 70 : 60) + bottomPadding;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              // Custom garden icon - using flower as closest match
              iconName = 'flower';
              break;
            case 'Plants':
              // Plants/collection icon - using grid as closest match
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case 'Community':
              // Community icon - using people
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Profile':
              // Profile icon - using person
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-circle-outline';
          }

          return <Ionicons name={iconName} size={isTablet ? 28 : 24} color={color} />;
        },
        tabBarActiveTintColor: colors.botanical.dark,
        tabBarInactiveTintColor: colors.botanical.sage,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'rgba(247, 245, 240, 0.95)',
          borderTopWidth: 0,
          paddingBottom: bottomPadding,
          paddingTop: isTablet ? 12 : 8,
          height: tabBarHeight,
          borderTopLeftRadius: isTablet ? 24 : 20,
          borderTopRightRadius: isTablet ? 24 : 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: isTablet ? 12 : 10,
          fontWeight: '700',
          marginTop: isTablet ? 4 : 2,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        headerStyle: {
          backgroundColor: colors.botanical.base,
          borderBottomWidth: 1,
          borderBottomColor: colors.ui.border,
        },
        headerTitleStyle: {
          color: colors.botanical.dark,
          fontSize: 18,
          fontWeight: 'bold',
        },
        headerTintColor: colors.botanical.dark,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Jardim',
          tabBarLabel: 'Jardim',
          headerShown: false, // Remove header to match original design
        }}
      />
      <Tab.Screen
        name="Plants"
        component={MyPlantsScreen}
        options={{
          title: 'Minhas Plantas',
          tabBarLabel: 'Plantas',
          headerShown: false, // Remove header to match original design
        }}
      />
      <Tab.Screen
        name="Community"
        component={CommunityScreen}
        options={{
          title: 'Comunidade',
          tabBarLabel: 'Comunidade',
          headerShown: false, // Remove header to match original design
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarLabel: 'Perfil',
          headerShown: false, // Remove header to match original design
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;