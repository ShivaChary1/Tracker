import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { TouchableOpacity, View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/lib/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: { name: string; label: string; icon: IoniconName; iconOut: IoniconName }[] = [
  { name: 'index',  label: 'Home',   icon: 'home',             iconOut: 'home-outline' },
  { name: 'tasks',  label: 'Tasks',  icon: 'checkmark-circle', iconOut: 'checkmark-circle-outline' },
  { name: 'goals',  label: 'Goals',  icon: 'flag',             iconOut: 'flag-outline' },
  { name: 'habits', label: 'Habits', icon: 'refresh-circle',   iconOut: 'refresh-circle-outline' },
  { name: 'more',   label: 'More',   icon: 'grid',             iconOut: 'grid-outline' },
];

function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <TouchableOpacity onPress={toggle} style={tog.btn} hitSlop={10}>
      <Ionicons name={isDark ? 'sunny' : 'moon'} size={20} color={isDark ? '#F59E0B' : '#3B82F6'} />
    </TouchableOpacity>
  );
}
const tog = StyleSheet.create({
  btn: { marginRight: 14, padding: 4 },
});

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes.filter(r => TABS.some(t => t.name === r.name));

  return (
    <View
      style={[
        tb.bar,
        {
          backgroundColor: colors.bg,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      {visibleRoutes.map(route => {
        const tab = TABS.find(t => t.name === route.name)!;
        const focused = state.routes[state.index].name === route.name;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity key={route.key} style={tb.tab} onPress={onPress} activeOpacity={0.7}>
            <View style={[tb.iconWrap, focused && { backgroundColor: colors.tabActiveBg }]}>
              <Ionicons
                name={focused ? tab.icon : tab.iconOut}
                size={23}
                color={focused ? colors.red : colors.textSub}
              />
            </View>
            <Text style={[tb.label, { color: focused ? colors.red : colors.textSub }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const tb = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 2,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  iconWrap: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});

export default function TabLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '800', fontSize: 18, color: colors.text },
        headerShadowVisible: false,
        headerRight: () => <ThemeToggle />,
      }}
    >
      <Tabs.Screen name="index"   options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="tasks"   options={{ title: 'Tasks' }} />
      <Tabs.Screen name="goals"   options={{ title: 'Goals' }} />
      <Tabs.Screen name="habits"  options={{ title: 'Habits' }} />
      <Tabs.Screen name="more"    options={{ title: 'More', headerRight: () => null }} />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
