import { useEffect, useState } from 'react'
import { MonthCalendar } from "./components/MonthCalendar";
import { CastWishEditor } from "./components/CastWishEditor";
import { ShowSelector } from "./components/ShowSelector";
import { loadShows, type Show } from "./lib/showLoader";
import { useSelectedShows } from "./hooks/useSelectedShows";
import type { CalendarEvent } from "./types";

import { AppBar, Box, Tab, Tabs, Toolbar, Typography } from '@mui/material';

import './assets/css/style.css';

function App() {
  const [tab, setTab] = useState(0);
  const [shows, setShows] = useState<Show[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { selectedShowIds, toggleShow } = useSelectedShows();

  useEffect(() => {
    loadShows().then(result => {
      setShows(result.shows);
      setEvents(result.events);
      setLoading(false);
    });
  }, []);

  return (
    <Box className="AppRoot">
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="h1" className="AppTitle">
            🎭キャストスケジューラー🎭
          </Typography>
        </Toolbar>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          centered
          sx={{ bgcolor: "background.paper" }}
        >
          <Tab label="カレンダー" />
          <Tab label="観たい作品" />
          <Tab label="キャスト希望" />
        </Tabs>
      </AppBar>

      {/* <Toolbar />
      <Box sx={{ height: 48 }} /> */}

      <Box className="AppContent">
        {loading ? (
          <div style={{ padding: 16 }}>読み込み中…</div>
        ) : (
          <>
            {tab === 0 && (
              <Box className="Calendar">
                <MonthCalendar events={events} selectedShowIds={selectedShowIds} />
              </Box>
            )}
            {tab === 1 && (
              <ShowSelector shows={shows} selectedShowIds={selectedShowIds} onToggleShow={toggleShow} />
            )}
            {tab === 2 && (
              <CastWishEditor shows={shows} events={events} selectedShowIds={selectedShowIds} />
            )}
          </>
        )}
      </Box>
    </Box>
  );
}

export default App;
