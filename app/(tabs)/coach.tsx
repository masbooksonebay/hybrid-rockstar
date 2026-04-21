import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Keyboard,
  Platform,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetch as expoFetch } from "expo/fetch";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useApp } from "../../lib/context";
import { COACH_ROB_SYSTEM_PROMPT } from "../../lib/coachPrompt";
import { RULES } from "../../data/rules";
import { spacing, borderRadius } from "../../constants/theme";
import DoneKeyboardToolbar, { KEYBOARD_DONE_ID } from "../../components/DoneKeyboardToolbar";

const COACH_ROB_API_URL = "https://hybrid-rockstar-api.vercel.app/api/coach-rob";
const CONNECT_ERROR_MESSAGE = "Coach Rob is having trouble connecting. Please try again in a moment.";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Message { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "What are the station weights for my division?",
  "How do I pace a hybrid race?",
  "What's the penalty for incomplete reps?",
  "How should I train in the 4 weeks before my race?",
  "What should I eat on race day?",
];

export default function CoachScreen() {
  const { theme, settings } = useApp();
  const tabBarHeight = useBottomTabBarHeight();
  const [tab, setTab] = useState<"chat" | "rules">("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [rulesSearch, setRulesSearch] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const baseMessages = [...messages, userMsg];
    setMessages(baseMessages);
    setInput("");
    setLoading(true);

    const showError = (log: string) => {
      console.error(`[CoachRob] ${log}`);
      setMessages([...baseMessages, { role: "assistant", content: CONNECT_ERROR_MESSAGE }]);
      setLoading(false);
    };

    try {
      const res = await expoFetch(COACH_ROB_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system:
            COACH_ROB_SYSTEM_PROMPT +
            `\n\nUser's format: ${settings.format ?? "unset"}. Tier: ${settings.tier ?? "unset"}. Gender: ${settings.gender ?? "unset"}.`,
          messages: baseMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) {
        let errCode = "unknown";
        let errMsg = "";
        try {
          const data = await res.json();
          errCode = data?.error?.code ?? errCode;
          errMsg = data?.error?.message ?? "";
        } catch {}
        showError(`Proxy ${res.status} ${errCode}: ${errMsg}`);
        return;
      }

      if (!res.body) {
        showError("Empty response body");
        return;
      }

      setMessages([...baseMessages, { role: "assistant", content: "" }]);
      setLoading(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let assembled = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sepIdx = buffer.indexOf("\n\n");
        while (sepIdx !== -1) {
          const frame = buffer.slice(0, sepIdx);
          buffer = buffer.slice(sepIdx + 2);
          sepIdx = buffer.indexOf("\n\n");

          for (const line of frame.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const payload = line.slice(5).trim();
            if (!payload) continue;
            try {
              const evt = JSON.parse(payload);
              if (evt?.type === "content_block_delta" && evt?.delta?.type === "text_delta") {
                const chunk = evt.delta.text as string;
                if (chunk) {
                  assembled += chunk;
                  const snapshot = assembled;
                  setMessages((prev) => {
                    const next = prev.slice();
                    const last = next[next.length - 1];
                    if (last && last.role === "assistant") {
                      next[next.length - 1] = { role: "assistant", content: snapshot };
                    }
                    return next;
                  });
                }
              }
            } catch {}
          }
        }
      }

      if (!assembled) {
        showError("Stream ended with no text");
        return;
      }
    } catch (err) {
      showError(`Network / fetch error: ${String(err)}`);
      return;
    }
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? tabBarHeight : 0}
    >
      <View style={[styles.tabRow, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.tab, tab === "chat" && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]} onPress={() => setTab("chat")}>
          <Text style={[styles.tabText, { color: tab === "chat" ? theme.text : theme.textSecondary }]}>CHAT</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === "rules" && { borderBottomColor: theme.accent, borderBottomWidth: 2 }]} onPress={() => setTab("rules")}>
          <Text style={[styles.tabText, { color: tab === "rules" ? theme.text : theme.textSecondary }]}>RULES</Text>
        </TouchableOpacity>
      </View>

      {tab === "chat" ? (
        <>
          <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} accessible={false}>
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.chatContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.length === 0 && (
                <View style={styles.suggestions}>
                  {SUGGESTIONS.map((s) => (
                    <TouchableOpacity key={s} style={[styles.suggestChip, { borderColor: theme.border }]} onPress={() => sendMessage(s)}>
                      <Text style={[styles.suggestText, { color: theme.text }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {messages.map((m, i) => (
                <View key={i} style={[styles.bubble, m.role === "user" ? { backgroundColor: theme.userBubble, alignSelf: "flex-end" } : { backgroundColor: theme.aiBubble, alignSelf: "flex-start", borderWidth: 1, borderColor: theme.border }]}>
                  <Text style={[styles.bubbleText, { color: m.role === "user" ? "#fff" : theme.text }]}>{m.content}</Text>
                </View>
              ))}
              {loading && (
                <View style={[styles.bubble, { backgroundColor: theme.aiBubble, alignSelf: "flex-start", borderWidth: 1, borderColor: theme.border }]}>
                  <ActivityIndicator size="small" color={theme.accent} />
                </View>
              )}
              <View style={{ height: 20 }} />
            </ScrollView>
          </TouchableWithoutFeedback>

          <Text style={[styles.disclaimer, { color: theme.textSecondary }]}>AI responses are for training guidance only. Always verify rules with the official race organization.</Text>

          <View style={[styles.inputRow, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Ask Coach Rob anything about hybrid racing..."
              placeholderTextColor={theme.textSecondary}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => sendMessage(input)}
              returnKeyType="send"
              multiline={false}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={() => Keyboard.dismiss()}
              hitSlop={10}
              style={styles.doneBtn}
              accessibilityLabel="Dismiss keyboard"
            >
              <Text style={[styles.doneText, { color: theme.accent }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <RulesTab search={rulesSearch} setSearch={setRulesSearch} />
      )}
      <DoneKeyboardToolbar />
    </KeyboardAvoidingView>
  );
}

function RulesTab({ search, setSearch }: { search: string; setSearch: (v: string) => void }) {
  const { theme } = useApp();
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const filteredRules = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return RULES.map((s) => ({ ...s, matched: false }));
    return RULES.map((s) => ({
      ...s,
      items: s.items.filter(
        (item) =>
          item.heading.toLowerCase().includes(q) || item.body.toLowerCase().includes(q)
      ),
      matched: true,
    })).filter((s) => s.items.length > 0);
  }, [search]);

  useEffect(() => {
    const q = search.trim();
    if (!q) return;
    const next: Record<string, boolean> = {};
    for (const s of filteredRules) next[s.title] = true;
    setOpenMap(next);
  }, [search, filteredRules]);

  const toggle = (title: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenMap((m) => ({ ...m, [title]: !m[title] }));
  };

  return (
    <ScrollView
      contentContainerStyle={styles.rulesContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <Text style={[styles.rulesNote, { color: theme.textSecondary }]}>Source: official race rules — always verify for competition.</Text>
      <View style={[styles.searchRow, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
        <Ionicons name="search" size={18} color={theme.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search rules..."
          placeholderTextColor={theme.textSecondary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          onSubmitEditing={() => Keyboard.dismiss()}
          inputAccessoryViewID={Platform.OS === "ios" ? KEYBOARD_DONE_ID : undefined}
        />
      </View>
      {filteredRules.map((section) => {
        const open = !!openMap[section.title];
        return (
          <View key={section.title} style={[styles.ruleSection, { borderBottomColor: theme.border }]}>
            <TouchableOpacity style={styles.ruleSectionHeader} onPress={() => toggle(section.title)} activeOpacity={0.7}>
              <Text style={[styles.ruleSectionTitle, { color: theme.text }]}>{section.title}</Text>
              <Ionicons name={open ? "remove" : "add"} size={20} color={theme.accent} />
            </TouchableOpacity>
            {open && (
              <View style={styles.ruleSectionBody}>
                {section.items.map((item) => (
                  <View key={item.heading} style={styles.ruleItem}>
                    <Text style={[styles.ruleHeading, { color: theme.text }]}>{item.heading}</Text>
                    <Text style={[styles.ruleBody, { color: theme.textSecondary }]}>{item.body}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabRow: { flexDirection: "row", borderBottomWidth: 1, position: "relative" },
  tab: { flex: 1, alignItems: "center", paddingVertical: spacing.sm + 4, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.5 },
  chatContent: { padding: spacing.md, flexGrow: 1 },
  suggestions: { marginTop: spacing.xl, alignItems: "center", gap: spacing.sm },
  suggestTitle: { fontSize: 14, marginBottom: spacing.sm },
  suggestChip: { borderWidth: 1, borderRadius: borderRadius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 2, width: "100%" },
  suggestText: { fontSize: 14, textAlign: "center" },
  bubble: { maxWidth: "80%", borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  disclaimer: { fontSize: 10, textAlign: "center", paddingVertical: spacing.xs },
  inputRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4, borderTopWidth: 1, gap: spacing.sm },
  input: { flex: 1, fontSize: 15, paddingVertical: spacing.sm },
  doneBtn: { width: 44, height: 22, justifyContent: "center", alignItems: "center" },
  doneText: { fontSize: 15, fontWeight: "600" },
  rulesContent: { padding: spacing.md },
  rulesNote: { fontSize: 11, textAlign: "center", marginBottom: spacing.md },
  searchRow: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: borderRadius.sm, paddingHorizontal: spacing.sm + 4, marginBottom: spacing.md },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: spacing.sm, marginLeft: spacing.sm },
  ruleSection: { borderBottomWidth: 0.5 },
  ruleSectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14 },
  ruleSectionTitle: { fontSize: 15, fontWeight: "700" },
  ruleSectionBody: { paddingBottom: spacing.sm + 2 },
  ruleItem: { paddingVertical: spacing.sm + 2 },
  ruleHeading: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  ruleBody: { fontSize: 13, lineHeight: 19 },
});
