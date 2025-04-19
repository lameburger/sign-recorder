import React, { useState, useEffect } from "react";
import styled from "styled-components";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";
import { createGlobalStyle } from "styled-components";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
} from "date-fns";

const TrackerContainer = styled.div`
  background-color: var(--background-light);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
`;

const Title = styled.h3`
  color: var(--accent-yellow);
  margin-bottom: 15px;
`;

const ToggleContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  justify-content: flex-end;
`;

const ToggleButton = styled.button`
  background-color: ${(props) =>
    props.active ? "var(--accent-green)" : "var(--background-dark)"};
  color: ${(props) =>
    props.active ? "var(--text-dark)" : "var(--text-light)"};
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;

  &:hover {
    opacity: 0.9;
  }
`;

const CheckboxContainer = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 10px;
  margin-bottom: 15px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.9rem;
  color: var(--text-light);
  cursor: pointer;
`;

const LegendContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 10px;
  font-size: 0.8rem;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
`;

const LegendColor = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background-color: ${(props) => props.color};
`;

// Custom tooltip for the heatmap
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "var(--background-dark)",
          padding: "5px 10px",
          border: "1px solid var(--accent-yellow)",
          borderRadius: "4px",
          fontSize: "0.8rem",
        }}
      >
        <p>{`Date: ${payload[0].payload.date}`}</p>
        <p>{`Uploads: ${payload[0].payload.count}`}</p>
        <p>{`Approved: ${payload[0].payload.approved}`}</p>
        <p>{`Pending: ${payload[0].payload.pending}`}</p>
      </div>
    );
  }
  return null;
};

// Custom tooltip for the line chart
const LineChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: "var(--background-dark)",
          padding: "5px 10px",
          border: "1px solid var(--accent-yellow)",
          borderRadius: "4px",
          fontSize: "0.8rem",
        }}
      >
        <p style={{ margin: "0 0 5px 0" }}>{`Date: ${format(
          new Date(label),
          "MMM d, yyyy"
        )}`}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: "0 0 3px 0", color: entry.color }}>
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ContributionTracker = ({ videos }) => {
  const [viewType, setViewType] = useState("contribution"); // 'contribution' or 'line'
  const [showApproved, setShowApproved] = useState(true);
  const [showPending, setShowPending] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Process videos data for the heatmap
  const getContributionData = () => {
    if (!videos || videos.length === 0) return [];

    // Create a map of dates to counts
    const dateMap = {};

    videos.forEach((video) => {
      // Convert Firebase timestamp to Date
      const date = video.createdAt?.toDate
        ? video.createdAt.toDate().toISOString().split("T")[0]
        : new Date(video.createdAt).toISOString().split("T")[0];

      if (!dateMap[date]) {
        dateMap[date] = { date, count: 0, approved: 0, pending: 0 };
      }

      dateMap[date].count += 1;
      if (video.approved) {
        dateMap[date].approved += 1;
      } else {
        dateMap[date].pending += 1;
      }
    });

    // Convert map to array
    return Object.values(dateMap);
  };

  // Process videos data for the line chart
  const getLineChartData = () => {
    if (!videos || videos.length === 0) return [];

    // Get date range (last 6 months)
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setMonth(startDate.getMonth() - 6);

    // Create a map for each day in the range
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const dateMap = {};

    days.forEach((day) => {
      const dateStr = format(day, "yyyy-MM-dd");
      dateMap[dateStr] = {
        date: dateStr,
        approved: 0,
        pending: 0,
        total: 0,
      };
    });

    // Fill in the data from videos
    videos.forEach((video) => {
      const videoDate = video.createdAt?.toDate
        ? video.createdAt.toDate()
        : new Date(video.createdAt);

      const dateStr = format(videoDate, "yyyy-MM-dd");

      // Skip if outside our range
      if (!dateMap[dateStr]) return;

      dateMap[dateStr].total += 1;
      if (video.approved) {
        dateMap[dateStr].approved += 1;
      } else {
        dateMap[dateStr].pending += 1;
      }
    });

    // Convert to array and sort by date
    return Object.values(dateMap).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  };

  // Get color for heatmap based on count and status
  const getColor = (value) => {
    if (!value || value.count === 0) return "#ebedf0"; // Empty color

    // If we're showing both or neither, use a neutral color based on count
    if ((showApproved && showPending) || (!showApproved && !showPending)) {
      const intensity = Math.min(value.count, 4); // Cap at 4 for color intensity
      return `rgba(110, 84, 148, ${0.25 * intensity + 0.1})`; // Purple with varying intensity
    }

    // If showing only approved
    if (showApproved && !showPending) {
      if (value.approved === 0) return "#ebedf0";
      const intensity = Math.min(value.approved, 4);
      return `rgba(0, 200, 0, ${0.25 * intensity + 0.1})`; // Green with varying intensity
    }

    // If showing only pending
    if (!showApproved && showPending) {
      if (value.pending === 0) return "#ebedf0";
      const intensity = Math.min(value.pending, 4);
      return `rgba(255, 204, 0, ${0.25 * intensity + 0.1})`; // Yellow with varying intensity
    }

    return "#ebedf0"; // Default
  };

  // Helper function to determine if a data point should be shown based on filters
  const showRelevantData = (value) => {
    if (!value) return false;
    if (showApproved && showPending) return value.count > 0;
    if (showApproved) return value.approved > 0;
    if (showPending) return value.pending > 0;
    return false;
  };

  const contributionData = getContributionData();
  const lineChartData = getLineChartData();

  // Calculate start and end dates for the heatmap (last 12 months)
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - 12);

  return (
    <TrackerContainer>
      <Title>Upload Activity</Title>

      <ToggleContainer>
        <ToggleButton
          active={viewType === "contribution"}
          onClick={() => setViewType("contribution")}
        >
          Contribution Graph
        </ToggleButton>
        <ToggleButton
          active={viewType === "line"}
          onClick={() => setViewType("line")}
        >
          Line Chart
        </ToggleButton>
      </ToggleContainer>

      <CheckboxContainer>
        <CheckboxLabel>
          <input
            type="checkbox"
            checked={showApproved}
            onChange={() => setShowApproved(!showApproved)}
          />
          Show Approved Videos
        </CheckboxLabel>
        <CheckboxLabel>
          <input
            type="checkbox"
            checked={showPending}
            onChange={() => setShowPending(!showPending)}
          />
          Show Pending Videos
        </CheckboxLabel>
      </CheckboxContainer>

      {viewType === "contribution" ? (
        <>
          <CalendarHeatmap
            startDate={startDate}
            endDate={endDate}
            values={contributionData}
            classForValue={(value) => {
              if (!value || !showRelevantData(value)) return "color-empty";
              return `color-scale-${Math.min(value.count, 4)}`;
            }}
            titleForValue={(value) => {
              if (!value) return "No uploads";
              return `${value.date}: ${value.count} uploads (${value.approved} approved, ${value.pending} pending)`;
            }}
            tooltipDataAttrs={(value) => {
              if (!value || !value.date) return null;
              return {
                "data-tip": `${value.date}: ${value.count} uploads (${value.approved} approved, ${value.pending} pending)`,
              };
            }}
            showWeekdayLabels={true}
            gutterSize={2}
            showOutOfRangeDays={false}
            transformDayElement={(element, value, index) => {
              if (!value || !showRelevantData(value)) return element;
              return React.cloneElement(element, {
                style: { fill: getColor(value) },
              });
            }}
          />

          <LegendContainer>
            <LegendItem>
              <LegendColor color="#ebedf0" />
              <span>No uploads</span>
            </LegendItem>
            {showApproved && (
              <LegendItem>
                <LegendColor color="rgba(0, 200, 0, 0.5)" />
                <span>Approved videos</span>
              </LegendItem>
            )}
            {showPending && (
              <LegendItem>
                <LegendColor color="rgba(255, 204, 0, 0.5)" />
                <span>Pending videos</span>
              </LegendItem>
            )}
            {showApproved && showPending && (
              <LegendItem>
                <LegendColor color="rgba(110, 84, 148, 0.5)" />
                <span>All videos</span>
              </LegendItem>
            )}
            <LegendItem>
              <span>More uploads = darker color</span>
            </LegendItem>
          </LegendContainer>
        </>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(new Date(date), "MMM d")}
              interval={Math.floor(lineChartData.length / 10)}
            />
            <YAxis />
            <Tooltip content={<LineChartTooltip />} />
            <Legend />
            {showApproved && (
              <Line
                type="monotone"
                dataKey="approved"
                stroke="var(--accent-green)"
                strokeWidth={2}
                activeDot={{ r: 6, fill: "var(--accent-green)" }}
                name="Approved Videos"
              />
            )}
            {showPending && (
              <Line
                type="monotone"
                dataKey="pending"
                stroke="var(--accent-yellow)"
                strokeWidth={2}
                activeDot={{ r: 6, fill: "var(--accent-yellow)" }}
                name="Pending Videos"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </TrackerContainer>
  );
};

export default ContributionTracker;
