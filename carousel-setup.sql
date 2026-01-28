-- Create carousel_insights table
CREATE TABLE IF NOT EXISTS carousel_insights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  header VARCHAR(255),
  subheader VARCHAR(255),
  items JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO carousel_insights (title, header, subheader, items) VALUES
('2025 Week 50', 'Premier League Week 50 Analysis', 'Top 5 Predictions & Trends', 
  JSON_ARRAY(
    JSON_OBJECT('title', 'Match 1', 'description', 'Manchester City vs Liverpool'),
    JSON_OBJECT('title', 'Match 2', 'description', 'Arsenal vs Chelsea'),
    JSON_OBJECT('title', 'Match 3', 'description', 'Tottenham vs Manchester United')
  )
),
('2025 Week 51', 'European Fixtures Preview', 'Champions League & Europa League',
  JSON_ARRAY(
    JSON_OBJECT('title', 'UCL', 'description', 'Knockout stage begins'),
    JSON_OBJECT('title', 'UEL', 'description', 'Round of 16 matches')
  )
),
('2025 Week 52', 'Holiday Special Edition', 'Winter Break Matches',
  JSON_ARRAY(
    JSON_OBJECT('title', 'Boxing Day', 'description', 'Premier League feast')
  )
),
('2026 Week 1', 'New Year Kickoff', 'January Transfer Window Analysis',
  JSON_ARRAY(
    JSON_OBJECT('title', 'Transfers', 'description', 'Winter market updates')
  )
),
('2026 Week 2', 'Mid-Winter Form Analysis', 'Performance Metrics Update',
  JSON_ARRAY(
    JSON_OBJECT('title', 'Stats', 'description', 'Season halfway analysis')
  )
),
('2026 Week 3', 'Cup Competition Focus', 'FA Cup & League Cup Insights',
  JSON_ARRAY(
    JSON_OBJECT('title', 'Cup Matches', 'description', 'Knockout stages preview')
  )
);
