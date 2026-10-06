import { AdaptiveText as Text } from "./AdaptiveText";
import { useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from "react-native";
import { colors, spacing } from "./tokens";

type Tone = "neutral" | "info" | "assist" | "success" | "warning" | "danger";
type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  icon?: ReactNode;
  tone?: Tone;
  variant?: "primary" | "secondary" | "ghost";
  selected?: boolean;
  busy?: boolean;
};

const tones: Record<Tone, { foreground: string; background: string }> = {
  neutral: { foreground: colors.textStrong, background: colors.panel },
  info: { foreground: colors.blueStrong, background: colors.blueSoft },
  assist: { foreground: colors.purple, background: colors.purpleSoft },
  success: { foreground: colors.accentStrong, background: colors.greenSoft },
  warning: { foreground: colors.amberText, background: colors.amberSoft },
  danger: { foreground: "#b4233f", background: "#fff0f2" },
};

/** Shared native action: scalable visible label, 48 dp target, explicit state. */
export function Button({ label, icon, tone = "success", variant = "primary", selected, busy = false, disabled = false, ...props }: ButtonProps) {
  const palette = tones[tone];
  const foreground = variant === "primary" && !selected ? colors.panel : palette.foreground;
  const background = selected ? palette.background : variant === "primary" ? palette.foreground : variant === "ghost" ? "transparent" : palette.background;
  return (
    <Pressable {...props} accessibilityRole="button" accessibilityLabel={props.accessibilityLabel ?? label} accessibilityState={{ ...props.accessibilityState, disabled: disabled || busy, busy, ...(selected === undefined ? {} : { selected }) }}
      disabled={disabled || busy} style={({ pressed }) => [styles.button, { backgroundColor: background, borderColor: selected || variant === "primary" ? palette.foreground : variant === "ghost" ? "transparent" : colors.controlBorder }, disabled && styles.disabled, pressed && styles.pressed]}>
      {busy ? <ActivityIndicator color={foreground} accessible={false} /> : icon ? <View accessible={false}>{icon}</View> : null}
      <Text style={[styles.label, { color: foreground }]}>{selected ? `✓ ${label}` : label}</Text>
    </Pressable>
  );
}

/** Supporting detail stays reachable without burying the current task. */
export function Disclosure({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <View style={styles.disclosure}>
    <Button label={label} tone="neutral" variant="ghost" icon={<Text style={styles.chevron}>{open ? "−" : "+"}</Text>} accessibilityState={{ expanded: open }} onPress={() => setOpen(value => !value)} />
    {open ? children : null}
  </View>;
}

const styles = StyleSheet.create({
  disclosure: { gap: spacing.md },
  chevron: { color: colors.textStrong, fontSize: 20 },
  button: { minWidth: 48, minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, maxWidth: "100%" },
  label: { flexShrink: 1, fontSize: 15, fontWeight: "600", textAlign: "center", lineHeight: 22 },
  disabled: { opacity: 0.45 },
  pressed: { opacity: 0.9 },
});
