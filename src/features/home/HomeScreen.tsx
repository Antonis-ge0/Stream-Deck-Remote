import { Image, StyleSheet, Text, View } from "react-native";
import { Keyboard, Monitor, Power } from "lucide-react-native";
import { ActionButton } from "../../components/ActionButton";
import type { AppColors } from "../../theme/palette";

type HomeScreenProps = {
  colors: AppColors;
  onDesktop: () => void;
  onPower: () => void;
  onSignIn: () => void;
};

export function HomeScreen({
  colors,
  onDesktop,
  onPower,
  onSignIn,
}: HomeScreenProps) {
  const styles = createStyles(colors);

  return (
    <View style={styles.content}>
      <View style={styles.brand}>
        <Image
          source={require("../../../assets/128x128.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>Stream Deck Remote</Text>
      </View>

      <View style={styles.actions}>
        <ActionButton
          colors={colors}
          icon={Power}
          label="Start PC"
          onPress={onPower}
          tone="neutral"
        />
        <ActionButton
          colors={colors}
          icon={Keyboard}
          label="Sign In"
          onPress={onSignIn}
          tone="neutral"
        />
        <ActionButton
          colors={colors}
          icon={Monitor}
          label="Desktop App"
          onPress={onDesktop}
          tone="neutral"
        />
      </View>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    content: {
      flex: 1,
      justifyContent: "center",
      gap: 34,
      paddingHorizontal: 24,
      paddingBottom: 42,
    },
    brand: {
      alignItems: "center",
      gap: 16,
    },
    logo: {
      height: 116,
      width: 116,
      resizeMode: "contain",
    },
    title: {
      color: colors.text,
      fontSize: 28,
      fontWeight: "900",
      textAlign: "center",
    },
    actions: {
      gap: 12,
    },
  });
}
