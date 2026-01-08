import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark', // dark 模式基础色板
    background: {
      default: '#0f172a', // 页面整体背景
      paper: '#0f172a', // 卡片/弹层背景
    },
    primary: {
      main: '#64d8ce', // 主按钮与强调色
    },
    secondary: {
      main: '#f2c14e', // 次级强调色
    },
    text: {
      primary: '#e2e8f0', // 主文字颜色
      secondary: '#94a3b8', // 次级/辅助文字颜色
    },
  },
  shape: {
    borderRadius: 14, // 全局圆角
  },
  typography: {
    fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif", // 全局字体
    h1: { fontWeight: 700, letterSpacing: -0.8 }, // H1 字重与字距
    h2: { fontWeight: 700, letterSpacing: -0.4 }, // H2 字重与字距
    h3: { fontWeight: 700 }, // H3 字重
    button: { textTransform: 'none', fontWeight: 600 }, // 按钮文字保持原样并加粗
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(255,255,255,0.08)', // Paper 边框
          backgroundImage: 'none', // 移除默认渐变
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid rgba(255,255,255,0.08)', // 卡片描边
          backgroundImage: 'none',
          boxShadow: '0 12px 24px rgba(0,0,0,0.25)', // 卡片阴影
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true, // 关闭默认阴影
      },
      styleOverrides: {
        root: {
          borderRadius: 999, // 胶囊按钮
        },
      },
    },
  },
});

export default theme;
