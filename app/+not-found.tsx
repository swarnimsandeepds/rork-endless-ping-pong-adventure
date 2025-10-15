import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!", headerShown: false }} />
      <View style={styles.container}>
        <LinearGradient
          colors={['#0f0c29', '#302b63', '#24243e']}
          style={StyleSheet.absoluteFillObject}
        />
        <Text style={styles.title}>404</Text>
        <Text style={styles.subtitle}>Screen not found</Text>

        <Link href="/" style={styles.link}>
          <LinearGradient
            colors={['#00f2fe', '#4facfe']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.linkGradient}
          >
            <Text style={styles.linkText}>Back to Game</Text>
          </LinearGradient>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 72,
    fontWeight: "800" as const,
    color: "#fff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: "rgba(255, 255, 255, 0.6)",
    marginBottom: 40,
  },
  link: {
    borderRadius: 25,
    overflow: "hidden",
  },
  linkGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  linkText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#fff",
    letterSpacing: 1,
  },
});
