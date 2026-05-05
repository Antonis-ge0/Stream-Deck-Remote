import { Keyboard, ShieldAlert } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { Section } from "../../components/Section";
import type { AppColors } from "../../theme/palette";

type SecureSignInNoticeProps = {
  colors: AppColors;
};

export function SecureSignInNotice({ colors }: SecureSignInNoticeProps) {
  const styles = createStyles(colors);

  return (
    <Section colors={colors} eyebrow="Windows" title="Sign-In">
      <View style={styles.row}>
        <View style={styles.iconBox}>
          <ShieldAlert color={colors.warning} size={20} strokeWidth={2.4} />
        </View>
        <Text style={styles.text}>
          PIN automation is intentionally not stored or replayed by this app.
        </Text>
      </View>

      <View style={styles.row}>
        <View style={styles.iconBox}>
          <Keyboard color={colors.primary} size={20} strokeWidth={2.4} />
        </View>
        <Text style={styles.text}>
          Use the phone keyboard panel for manual sign-in, then connect to the
          desktop app when Windows finishes loading.
        </Text>
      </View>
    </Section>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    row: {
      alignItems: "center",
      flexDirection: "row",
      gap: 12,
      marginBottom: 10,
    },
    iconBox: {
      alignItems: "center",
      backgroundColor: colors.panelAlt,
      borderColor: colors.border,
      borderRadius: 8,
      borderWidth: 1,
      height: 38,
      justifyContent: "center",
      width: 38,
    },
    text: {
      color: colors.text,
      flex: 1,
      fontSize: 13,
      fontWeight: "700",
      lineHeight: 18,
    },
  });
}
