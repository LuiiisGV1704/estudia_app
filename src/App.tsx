import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { TabLayout } from './components/layout/TabLayout';
import { Toast } from './components/ui/Toast';
import Agenda from './pages/Agenda';
import Ajustes from './pages/Ajustes';
import Biblioteca from './pages/Biblioteca';
import Busqueda from './pages/Busqueda';
import Estadisticas from './pages/Estadisticas';
import Focus from './pages/Focus';
import Grupos from './pages/Grupos';
import Home from './pages/Home';
import Reader from './pages/Reader';
import ReviewSession from './pages/ReviewSession';
import Tarjetas from './pages/Tarjetas';
import { AppProvider } from './state/AppProvider';
import { SessionProvider } from './state/SessionProvider';
import { ThemeProvider } from './state/ThemeProvider';

const App = () => (
  <ThemeProvider>
    <AppProvider>
      <SessionProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route element={<TabLayout />}>
              <Route index element={<Home />} />
              <Route path="biblioteca" element={<Biblioteca />} />
              <Route path="tarjetas" element={<Tarjetas />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="grupos" element={<Grupos />} />
            </Route>
            <Route path="ajustes" element={<Ajustes />} />
            <Route path="estadisticas" element={<Estadisticas />} />
            <Route path="buscar" element={<Busqueda />} />
            <Route path="enfoque" element={<Focus />} />
            <Route path="repaso/:deckId" element={<ReviewSession />} />
            <Route path="lector/:bookId" element={<Reader />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toast />
        </BrowserRouter>
      </SessionProvider>
    </AppProvider>
  </ThemeProvider>
);

export default App;
