declare module 'react-native-html-to-pdf' {
    interface Options {
      html: string;
      fileName: string;
      directory: 'Documents' | 'Downloads' | 'Cache';
      width?: number;
      height?: number;
      base64?: boolean;
      // Add any other options you might need based on the library's documentation
    }
  
    export default {
      convert: (options: Options) => Promise<{ filePath: string }>
    };
  }
  