import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "../../lib/context";
import { spacing, borderRadius } from "../../constants/theme";
import shopData from "../../data/shop.json";

export default function ShopScreen() {
  const { theme } = useApp();
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.disclosure, { color: theme.textSecondary, borderColor: theme.border }]}>{shopData.disclosure}</Text>
      {shopData.categories.map((cat) => (
        <View key={cat.title} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{cat.title}</Text>
          {cat.products.map((p) => (
            <TouchableOpacity key={p.brand} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} activeOpacity={0.7} onPress={() => Linking.openURL(p.url)}>
              <View style={[styles.iconCircle, { backgroundColor: theme.accent + "15" }]}>
                <Ionicons name="barbell-outline" size={22} color={theme.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.brand, { color: theme.text }]}>{p.brand}</Text>
                <Text style={[styles.productName, { color: theme.textSecondary }]}>{p.name}</Text>
                <Text style={[styles.description, { color: theme.textSecondary }]}>{p.description}</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
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
  disclosure: { fontSize: 11, lineHeight: 16, textAlign: "center", paddingBottom: spacing.md, marginBottom: spacing.md, borderBottomWidth: 1 },
  section: { marginBottom: spacing.md },
  sectionTitle: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: spacing.sm },
  card: { flexDirection: "row", alignItems: "center", borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm + 2, borderWidth: 1, gap: spacing.md },
  iconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 16, fontWeight: "700" },
  productName: { fontSize: 12, marginTop: 1 },
  description: { fontSize: 12, lineHeight: 17, marginTop: 4 },
});
