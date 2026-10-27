-- Sample headlines so the front page isn't empty. Safe to delete later.
insert into public.links (title, url, section, kind, position, is_red, is_bold, image_url) values
  ('SENATE STRIKES LATE-NIGHT DEAL AS SHUTDOWN CLOCK TICKS DOWN', 'https://example.com/siren', 'siren', 'story', 0, true, true, null),

  ('Markets whipsaw on surprise rate signal...', 'https://example.com/top1', 'top', 'story', 0, false, false, null),
  ('Storm system to slam Midwest by weekend', 'https://example.com/top2', 'top', 'story', 1, true, false, null),

  ('Tech giants brace for new antitrust push...', 'https://example.com/a1', 'col1', 'story', 0, false, false, null),
  ('Inside the race to build the next chip fab', 'https://example.com/a2', 'col1', 'story', 1, false, false, null),
  ('Airline delays ripple across East Coast', 'https://example.com/a3', 'col1', 'story', 2, true, false, null),
  ('Housing starts fall for third month', 'https://example.com/a4', 'col1', 'story', 3, false, false, null),

  ('Governor signs sweeping transit bill...', 'https://example.com/b1', 'col2', 'story', 0, false, false, null),
  ('Study: Remote workers logging longer hours', 'https://example.com/b2', 'col2', 'story', 1, false, false, null),
  ('Recall widens on popular SUV models', 'https://example.com/b3', 'col2', 'story', 2, false, true, null),
  ('Mystery signal puzzles astronomers', 'https://example.com/b4', 'col2', 'story', 3, false, false, null),

  ('Hollywood strike talks resume...', 'https://example.com/c1', 'col3', 'story', 0, false, false, null),
  ('Retail sales beat expectations', 'https://example.com/c2', 'col3', 'story', 1, false, false, null),
  ('UPDATE: Bridge reopens after inspection', 'https://example.com/c3', 'col3', 'story', 2, true, false, null),

  ('AP', 'https://apnews.com', 'col1', 'resource', 0, false, false, null),
  ('REUTERS', 'https://www.reuters.com', 'col1', 'resource', 1, false, false, null),
  ('BBC', 'https://www.bbc.com/news', 'col2', 'resource', 0, false, false, null),
  ('BLOOMBERG', 'https://www.bloomberg.com', 'col2', 'resource', 1, false, false, null),
  ('WEATHER', 'https://www.weather.gov', 'col3', 'resource', 0, false, false, null);
