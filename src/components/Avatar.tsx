import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { StyleSheet, View, Alert, Image, Button } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { decode } from "base64-arraybuffer";
import { nanoid } from "nanoid";

interface Props {
  size: number;
  url: string | null;
  onUpload: (filePath: string) => void;
}

interface FileObject {
  uri: string;
  type: string;
  name: string;
}

export default function Avatar({ url, size = 150, onUpload }: Props) {
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const avatarSize = { height: size, width: size };

  useEffect(() => {
    if (url) downloadImage(url);
  }, [url]);

  async function downloadImage(path: string) {
    try {
      const { data, error } = await supabase.storage
        .from("avatars")
        .download(path);

      console.log("result: ", path);

      if (error) {
        throw error;
      }

      const fr = new FileReader();
      fr.readAsDataURL(data);
      fr.onload = () => {
        setAvatarUrl(fr.result as string);
      };
    } catch (error) {
      if (error instanceof Error) {
        console.log("Error downloading image: ", error.message);
      }
    }
  }

  async function uploadAvatar() {
    try {
      setUploading(true);

      const file = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: false,
      });

      if (file.type === "success") {
        const base64data = await getBase64FromFileUri(file.uri);
        const base64Image = `data:${file.mimeType};base64,${base64data}`;
        setAvatarUrl(base64Image);

        // const base64Str = base64Image.includes("base64,")
        //   ? base64Image.substring(
        //       base64Image.indexOf("base64,") + "base64,".length
        //     )
        //   : base64Image;
        // const res = decode(base64Str);

        // console.log("Res: ", res);

        await uploadFileToSupabase(file);

        // const { uri, name, type } = file;

        // const formData = new FormData();
        // formData.append("file", { uri, type, name } as any);

        // const fileExt = name.split(".").pop();
        // const filePath = `${Math.random()}.${fileExt}`;

        // console.log("filepath: ", filePath);

        // const { error } = await supabase.storage
        //   .from("avatars")
        //   .upload(`random/${filePath}`, formData, {
        //     contentType: "image/jpg",
        //   });

        // if (error) {
        //   throw error;
        // }

        // onUpload(filePath);
      } else if (file.type === "cancel") {
        Alert.alert("Cancelled.");
      }
    } catch (error: any) {
      if (error.code === "USER_CANCELLED") {
        console.warn("cancelled");
        // User cancelled the picker, exit any dialogs or menus and move on
      } else if (error.code === "MULTIPLE_PICKERS_ERROR") {
        console.warn(
          "multiple pickers were opened, only the last will be considered"
        );
      } else if (error instanceof Error) {
        Alert.alert("Yoo", error.message);
      } else {
        throw error;
      }
    } finally {
      setUploading(false);
    }
  }

  async function getBase64FromFileUri(uri: string): Promise<string> {
    const file = await fetch(uri);
    const blob = await file.blob();
    const base64data = await blobToBase64(blob);
    return base64data;
  }

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result?.toString().split(",")[1] || "");
      };
      reader.readAsDataURL(blob);
    });
  }

  async function uploadFileToSupabase(file: FileObject) {
    try {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const { error } = await supabase.storage
        .from("public")
        .upload(`random/${file.name}`, blob, {
          upsert: false,
        });

      if (error) {
        throw error;
      }

      console.log("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  }

  return (
    <View>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          accessibilityLabel="Avatar"
          style={[avatarSize, styles.avatar, styles.image]}
        />
      ) : (
        <View style={[avatarSize, styles.avatar, styles.noImage]} />
      )}
      <View>
        <Button
          title={uploading ? "Uploading ..." : "Upload"}
          onPress={uploadAvatar}
          disabled={uploading}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: 5,
    overflow: "hidden",
    maxWidth: "100%",
  },
  image: {
    resizeMode: "cover",
    paddingTop: 0,
  },
  noImage: {
    backgroundColor: "#333",
    borderWidth: 1,
    borderColor: "rgb(200, 200, 200)",
    borderRadius: 5,
  },
});
