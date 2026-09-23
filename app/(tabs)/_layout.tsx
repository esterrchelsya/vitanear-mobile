import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Tabs } from "expo-router";
import CustomTabBar from "../../components/CustomTabBar";
import { useLanguage } from "../../lib/LanguageContext";

export default function TabsLayout() {
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (
        <CustomTabBar {...(props as unknown as BottomTabBarProps)} />
      )}
    >
      <Tabs.Screen name="home" options={{ title: t("tabs.home") }} />
      <Tabs.Screen name="cari" options={{ title: t("tabs.search") }} />
      <Tabs.Screen
        name="transaksi"
        options={{ title: t("tabs.transactions") }}
      />
      <Tabs.Screen name="profil" options={{ title: t("tabs.profile") }} />
    </Tabs>
  );
}
