import { Image } from "expo-image";

export default function Logo() {
	return (
		<Image
			source={require("@/assets/images/logo.png")}
			style={{ width: 80, height: 80 }}
			contentFit="contain"
		/>
	);
}
