import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useWindowDimensions } from "react-native";

type DeckConfig = {
  activeProfileId: string;
  profiles: Profile[];
};

type Profile = {
  id: string;
  name: string;
  buttons: DeckButton[];
};

type DeckButton = {
  id: string;
  label: string;
  icon?: string | null;
};

export default function App() {
  const [host, setHost] = useState("192.168.1.216");
  const [port, setPort] = useState("37123");
  const [status, setStatus] = useState<"idle" | "connecting" | "connected">(
    "idle"
  );
  const [config, setConfig] = useState<DeckConfig | null>(null);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const url = useMemo(() => `ws://${host}:${port}`, [host, port]);

  const activeProfile = useMemo(() => {
    if (!config) return null;

    return (
      config.profiles.find((p) => p.id === activeProfileId) ??
      config.profiles.find((p) => p.id === config.activeProfileId) ??
      config.profiles[0] ??
      null
    );
  }, [config, activeProfileId]);

  function connect() {
    wsRef.current?.close();
    setStatus("connecting");

    const ws = new WebSocket(url);

    ws.onopen = () => {
      wsRef.current = ws;
      setStatus("connected");

      ws.send(JSON.stringify({ type: "getConfig" }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === "config") {
          setConfig(message.config);
          setActiveProfileId(message.config.activeProfileId);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onerror = () => {
      setStatus("idle");
      Alert.alert("Connection failed", `Could not connect to ${url}`);
    };

    ws.onclose = () => {
      wsRef.current = null;
      setStatus("idle");
    };
  }

  function disconnect() {
    wsRef.current?.close();
    wsRef.current = null;
    setStatus("idle");
    setConfig(null);
  }

  function refreshConfig() {
    wsRef.current?.send(JSON.stringify({ type: "getConfig" }));
  }

  function trigger(buttonId: string) {
    const ws = wsRef.current;

    if (!ws || status !== "connected") {
      Alert.alert("Not connected", "Connect to the desktop app first.");
      return;
    }

    ws.send(
      JSON.stringify({
        type: "triggerButton",
        buttonId,
        profileId: activeProfile?.id,
      })
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Deck Remote</Text>
          <Text style={styles.subtitle}>
            {status === "connected" ? "Connected" : "Connect to desktop"}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.statusPill,
            status === "connected" && styles.statusConnected,
          ]}
          onPress={status === "connected" ? disconnect : connect}
        >
          <Text style={styles.statusText}>
            {status === "connected" ? "Disconnect" : "Connect"}
          </Text>
        </TouchableOpacity>
      </View>

      {status !== "connected" && (
        <View style={styles.connectionCard}>
          <Text style={styles.label}>Desktop IP</Text>

          <View style={styles.row}>
            <TextInput
              style={styles.hostInput}
              value={host}
              onChangeText={setHost}
              placeholder="192.168.1.216"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.portInput}
              value={port}
              onChangeText={setPort}
              keyboardType="number-pad"
              placeholder="37123"
              placeholderTextColor="#64748b"
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={connect}>
            <Text style={styles.primaryText}>
              {status === "connecting" ? "Connecting..." : "Connect"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {status === "connected" && (
        <>
          <View style={styles.profileBar}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={config?.profiles ?? []}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const active = item.id === activeProfile?.id;

                return (
                  <TouchableOpacity
                    style={[
                      styles.profileChip,
                      active && styles.profileChipActive,
                    ]}
                    onPress={() => setActiveProfileId(item.id)}
                  >
                    <Text
                      style={[
                        styles.profileChipText,
                        active && styles.profileChipTextActive,
                      ]}
                    >
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            <TouchableOpacity style={styles.refreshButton} onPress={refreshConfig}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {!activeProfile ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No profiles found</Text>
              <Text style={styles.emptyText}>
                Add a profile in the desktop app, then tap Refresh.
              </Text>
            </View>
          ) : activeProfile.buttons.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{activeProfile.name}</Text>
              <Text style={styles.emptyText}>
                This profile has no buttons yet.
              </Text>
            </View>
          ) : (
            <ResponsiveButtonGrid
              buttons={activeProfile.buttons}
              onTrigger={trigger}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}
function ResponsiveButtonGrid({
  buttons,
  onTrigger,
}: {
  buttons: DeckButton[];
  onTrigger: (id: string) => void;
}) {
  const { width, height } = useWindowDimensions();

  const isLandscape = width > height;
  const horizontalPadding = 32;
  const gap = 10;
  const availableWidth = width - horizontalPadding;

  let columns = 2;

  if (width >= 1200) columns = 7;
  else if (width >= 1000) columns = 6;
  else if (width >= 800) columns = 5;
  else if (width >= 600) columns = 4;
  else if (width >= 390) columns = 3;
  else columns = 2;

  if (isLandscape && width >= 700) {
    columns = Math.min(columns + 1, 8);
  }

  const buttonSize = Math.floor(
    (availableWidth - gap * (columns * 2)) / columns
  );

  const finalButtonSize = Math.max(92, Math.min(buttonSize, 160));
  const iconSize = Math.max(34, Math.min(finalButtonSize * 0.38, 58));
  const fontSize = Math.max(12, Math.min(finalButtonSize * 0.13, 17));

  return (
    <FlatList
      data={buttons}
      numColumns={columns}
      key={columns}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={styles.gridRow}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[
            styles.deckButton,
            {
              width: finalButtonSize,
              height: finalButtonSize,
              margin: gap / 2,
            },
          ]}
          onPress={() => onTrigger(item.id)}
          activeOpacity={0.75}
        >
          <RemoteIcon icon={item.icon} size={iconSize} />
          <Text numberOfLines={2} style={[styles.buttonText, { fontSize }]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      )}
    />
  );
}
function RemoteIcon({
  icon,
  size,
}: {
  icon?: string | null;
  size: number;
}) {
  if (!icon) {
    return (
      <View
        style={[
          styles.emptyIcon,
          {
            width: size,
            height: size,
            borderRadius: size * 0.28,
          },
        ]}
      />
    );
  }

  const isImage =
    icon.startsWith("data:") || icon.startsWith("http") || icon.startsWith("/");

  if (isImage) {
    return (
      <Image
        source={{ uri: icon }}
        style={{
          width: size,
          height: size,
          resizeMode: "contain",
        }}
      />
    );
  }

  return <Text style={{ fontSize: size * 0.84 }}>{icon}</Text>;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0f172a",
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
  },
  title: {
    color: "white",
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    color: "#94a3b8",
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  statusConnected: {
    backgroundColor: "#7f1d1d",
  },
  statusText: {
    color: "white",
    fontWeight: "800",
  },
  connectionCard: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 24,
    padding: 18,
    marginTop: 12,
  },
  label: {
    color: "#cbd5e1",
    marginBottom: 8,
    fontWeight: "800",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  hostInput: {
    flex: 1,
    backgroundColor: "#111827",
    color: "white",
    padding: 14,
    borderRadius: 14,
    fontSize: 16,
  },
  portInput: {
    width: 96,
    backgroundColor: "#111827",
    color: "white",
    padding: 14,
    borderRadius: 14,
    fontSize: 16,
  },
  primaryButton: {
    marginTop: 14,
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  primaryText: {
    color: "white",
    fontWeight: "900",
    fontSize: 16,
  },
  profileBar: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginBottom: 10,
  },
  profileChip: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 8,
  },
  profileChipActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  profileChipText: {
    color: "#cbd5e1",
    fontWeight: "800",
  },
  profileChipTextActive: {
    color: "white",
  },
  refreshButton: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
  },
  refreshText: {
    color: "white",
    fontWeight: "800",
  },
  grid: {
    paddingBottom: 28,
    alignItems: "center",
  },
  gridRow: {
  justifyContent: "center",
  },
  deckButton: {
    backgroundColor: "#1f2937",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "900",
    textAlign: "center",
    marginTop: 8,
  },
  iconImage: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  emojiIcon: {
    fontSize: 42,
  },
  emptyIcon: {
    backgroundColor: "#334155",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyTitle: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },
  emptyText: {
    color: "#94a3b8",
    textAlign: "center",
  },
});