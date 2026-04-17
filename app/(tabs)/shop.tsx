import { View, Text, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../lib/context";
import { spacing, borderRadius } from "../../constants/theme";
import shopData from "../../data/shop.json";

export default function ShopScreen() {
  const { theme } = useApp();
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.banner, { borderColor: theme.accent, backgroundColor: theme.accent + "15" }]}>
        <Text style={[styles.bannerHeading, { color: theme.accent }]}>Equipment, Accessories & Nutrition</Text>
        <Text style={[styles.bannerSub, { color: theme.text }]}>
          We&apos;re curating the best partners for hybrid athletes — exclusive discount codes and vendor links coming soon.
        </Text>
      </View>

      <Text style={[styles.disclosure, { color: theme.textSecondary, borderColor: theme.border }]}>{shopData.disclosure}</Text>
      {shopData.categories.map((cat) => (
        <View key={cat.title} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{cat.title}</Text>
          {cat.products.map((p) => (
            <View key={p.brand} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={[styles.iconCircle, { backgroundColor: theme.accent + "15" }]}>
                <Ionicons name="barbell-outline" size={22} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.brand, { color: theme.text }]}>{p.brand}</Text>
                <Text style={[styles.productName, { color: theme.textSecondary }]}>{p.name}</Text>
                <Text style={[styles.description, { color: theme.textSecondary }]}>{p.description}</Text>
                <Text style={[styles.comingSoon, { color: theme.accent }]}>Vendor links and coupon codes coming soon</Text>
              </View>
            </View>
          ))}
        </View>
      ))}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.md },
  banner: { borderWidth: 1, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.md },
  bannerHeading: { fontSize: 16, fontWeight: "800", marginBottom: 4 },
  bannerSub: { fontSize: 13, lineHeight: 19 },
  disclosure: { fontSize: 11, lineHeight: 16, textAlign: "center", paddingBottom: spacing.md, marginBottom: spacing.md, borderBottomWidth: 1 },
  section: { marginBottom: spacing.md },
  sectionTitle: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: spacing.sm },
  card: { flexDirection: "row", alignItems: "center", borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm + 2, borderWidth: 1, gap: spacing.md },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 16, fontWeight: "700" },
  productName: { fontSize: 12, marginTop: 1 },
  description: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  comingSoon: { fontSize: 11, fontWeight: "600", marginTop: 6 },
});
