import { Box, Container } from '@mui/material';
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

const Layout = ({ children }: Props) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `
          radial-gradient(circle at 20% 20%, rgba(100, 216, 206, 0.08), transparent 32%),
          radial-gradient(circle at 80% 0%, rgba(242, 193, 78, 0.08), transparent 28%),
          #0f172a
        `,
        color: 'text.primary',
      }}
    >
      <Container>{children}</Container>
    </Box>
  );
};

export default Layout;
