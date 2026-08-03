import { useEffect, useState } from 'react'
import { MonthCalendar } from "./components/MonthCalendar";
import { CastWishEditor } from "./components/CastWishEditor";
import { SchedulePlanner } from "./components/SchedulePlanner";
import { loadShows, type Show } from "./lib/showLoader";
import type { CalendarEvent } from "./types";

import { AppBar, Box, Tab, Tabs, Toolbar, Typography } from '@mui/material';

import './assets/css/style.css';

function App() {
  const [tab, setTab] = useState(0);
  const [shows, setShows] = useState<Show[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShows().then(result => {
      setShows(result.shows);
      setEvents(result.events);
      setLoading(false);
    });
  }, []);

  return (
    <Box className="AppRoot">
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="h1" className="AppTitle">
            🎭観劇スケジューラー🎭
          </Typography>
        </Toolbar>
      </AppBar>

      <Toolbar />

      <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
        <Tab label="カレンダー" />
        <Tab label="キャスト希望" />
        <Tab label="プラン" />
      </Tabs>

      <Box className="AppContent">
        {loading ? (
          <div style={{ padding: 16 }}>読み込み中…</div>
        ) : (
          <>
            {tab === 0 && (
              <Box className="Calendar">
                <MonthCalendar events={events} />
              </Box>
            )}
            {tab === 1 && <CastWishEditor shows={shows} events={events} />}
            {tab === 2 && <SchedulePlanner shows={shows} events={events} />}
          </>
        )}
      </Box>
    </Box>
  );
}

export default App;
