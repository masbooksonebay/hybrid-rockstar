import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as WebBrowser from "expo-web-browser";
import { useApp } from "../../lib/context";
import { spacing, borderRadius } from "../../constants/theme";
import { CATEGORIES, CategoryKey, DEFAULT_OPEN_CATEGORIES, Vendor } from "../../constants/vendors";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ANALYTICS_KEY = "hr_settings"; // analytics flag lives inside the consolidated settings blob

export default function ShopScreen() {
  const { theme } = useApp();
  const [open, setOpen] = useState<Record<CategoryKey, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const c of CATEGORIES) initial[c.key] = DEFAULT_OPEN_CATEGORIES.includes(c.key);
    return initial as Record<CategoryKey, boolean>;
  });
  const [analyticsEnabled, setAnalyticsEnabled] = useState<boolean>(true);

  useEffect(() => {
    AsyncStorage.getItem(ANALYTICS_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        if (typeof parsed.analyticsEnabled === "boolean") setAnalyticsEnabled(parsed.analyticsEnabled);
      } catch {}
    });
  }, []);

  const toggle = (key: CategoryKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((m) => ({ ...m, [key]: !m[key] }));
  };

  const onShop = async (vendor: Vendor) => {
    if (!vendor.url) return;
    if (analyticsEnabled) {
      try {
        const clicksKey = `hr_shop_clicks_${vendor.slug}`;
        const lastKey = `hr_shop_last_click_${vendor.slug}`;
        const raw = await AsyncStorage.getItem(clicksKey);
        const next = (raw ? parseInt(raw, 10) || 0 : 0) + 1;
        await AsyncStorage.multiSet([
          [clicksKey, String(next)],
          [lastKey, new Date().toISOString()],
        ]);
      } catch (err) {
        console.error("[Shop] analytics write failed", err);
      }
    }
    try {
      await WebBrowser.openBrowserAsync(vendor.url);
    } catch (err) {
      console.error("[Shop] WebBrowser failed", err);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.banner, { borderColor: theme.accent, backgroundColor: theme.accent + "12" }]}>
        <Text style={[styles.bannerHeading, { color: theme.accent }]}>Equipment, Accessories & Nutrition</Text>
        <Text style={[styles.bannerSub, { color: theme.text }]}>Exclusive discounts coming soon.</Text>
      </View>

      {CATEGORIES.map((cat) => {
        const visible = cat.vendors.filter((v) => v.status !== "disabled");
        const isOpen = !!open[cat.key];
        return (
          <View key={cat.key} style={[styles.categoryWrap, { borderBottomColor: theme.border }]}>
            <TouchableOpacity style={styles.categoryHeader} onPress={() => toggle(cat.key)} activeOpacity={0.7}>
              <Text style={[styles.categoryLabel, { color: theme.textSecondary }]}>
                {cat.label} <Text style={[styles.categoryCount, { color: theme.textTertiary }]}>({visible.length})</Text>
              </Text>
              <Ionicons name={isOpen ? "remove" : "add"} size={20} color={theme.accent} />
            </TouchableOpacity>
            {isOpen && (
              <View style={styles.cardList}>
                {visible.map((v) => (
                  <VendorCard key={v.slug} vendor={v} icon={cat.icon} onShop={() => onShop(v)} />
                ))}
              </View>
            )}
          </View>
        );
      })}

      <Text style={[styles.footer, { color: theme.textSecondary }]}>
        Hybrid Rockstar may earn a small commission on purchases made through links on this page, at no extra cost to you.
      </Text>
      <View style={{ height: 60 }} />
    </ScrollView>
  );
}

function VendorCard({ vendor, icon, onShop }: { vendor: Vendor; icon: string; onShop: () => void }) {
  const { theme } = useApp();
  const isComingSoon = vendor.status === "coming_soon";

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border, opacity: isComingSoon ? 0.6 : 1 },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: theme.accent + "15" }]}>
        <Ionicons name={icon as any} size={22} color={theme.accent} />
      </View>
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={[styles.brand, { color: theme.text }]} numberOfLines={1}>{vendor.name}</Text>
          {vendor.officialPartner && (
            <View style={[styles.partnerPill, { backgroundColor: theme.accent + "20", borderColor: theme.accent }]}>
              <Text style={[styles.partnerPillText, { color: theme.accent }]}>Official HYROX Partner</Text>
            </View>
          )}
        </View>
        <Text style={[styles.tagline, { color: theme.textSecondary }]} numberOfLines={2}>
          {vendor.tagline}
        </Text>
        <View style={styles.ctaRow}>
          {isComingSoon ? (
            <View style={[styles.comingSoonPill, { backgroundColor: theme.accent + "20", borderColor: theme.accent }]}>
              <Text style={[styles.comingSoonText, { color: theme.accent }]}>Coming Soon</Text>
            </View>
          ) : (
            <TouchableOpacity onPress={onShop}>
              <Text style={[styles.shopBtn, { color: theme.accent }]}>Shop Now →</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  banner: { borderWidth: 1, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  bannerHeading: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  bannerSub: { fontSize: 13, lineHeight: 19 },
  categoryWrap: { borderBottomWidth: 0.5 },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14 },
  categoryLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  categoryCount: { fontSize: 12, fontWeight: "600" },
  cardList: { paddingBottom: spacing.sm + 4 },
  card: { flexDirection: "row", alignItems: "flex-start", borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm + 2, borderWidth: 1, gap: spacing.md },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  cardBody: { flex: 1 },
  cardTitleRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  brand: { fontSize: 17, fontWeight: "700", flexShrink: 1 },
  partnerPill: { borderWidth: 1, borderRadius: borderRadius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  partnerPillText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.4 },
  tagline: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  ctaRow: { marginTop: spacing.sm, alignItems: "flex-start" },
  shopBtn: { fontSize: 14, fontWeight: "700" },
  comingSoonPill: { borderWidth: 1, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm + 2, paddingVertical: 4 },
  comingSoonText: { fontSize: 11, fontWeight: "700" },
  footer: { fontSize: 11, lineHeight: 16, textAlign: "center", marginTop: spacing.xl, paddingHorizontal: spacing.sm },
});
