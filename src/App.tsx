import { Button } from '@mui/material';
import { Link } from 'react-router-dom';
import Layout from './components/Layout';
import SiteHeader from './components/SiteHeader';
import AppRoutes from './routes';
import GlobalSnackbar from './components/GlobalSnackbar';

function App() {
  return (
    <>
      <SiteHeader
        actions={
          <Button variant="contained" color="primary" component={Link} to="/expenses">
            快速记一笔
          </Button>
        }
      />
      <Layout>
        <AppRoutes />
      </Layout>
      <GlobalSnackbar />
    </>
  );
}

export default App;
