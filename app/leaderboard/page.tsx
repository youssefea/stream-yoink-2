"use client";
import { useEffect, useState } from "react";

type LeaderboardEntry = {
  userHandle: string;
  score: number;
};

type CurrentYoinker = {
  profileHandle: string;
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentYoinker, setCurrentYoinker] = useState<CurrentYoinker | null>(
    null
  );

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch leaderboard data
        const leaderboardResponse = await fetch("/leaderboardApi");
        const leaderboardData: (string | number)[] =
          await leaderboardResponse.json();

        const parsedLeaderboardData: LeaderboardEntry[] = [];
        for (let i = 0; i < leaderboardData.length; i += 2) {
          parsedLeaderboardData.push({
            userHandle: leaderboardData[i] as string,
            score: leaderboardData[i + 1] as number,
          });
        }
        // Reverse the array to correct the ranking order
        setLeaderboard(parsedLeaderboardData.reverse());

        // Fetch current yoinker data
        const currentYoinkerResponse = await fetch("/currentYoinkerApi");
        const currentYoinkerData: CurrentYoinker =
          await currentYoinkerResponse.json();
        setCurrentYoinker(currentYoinkerData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    }

    fetchData();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
      }}
    >
      <a href="https://warpcast.com/superfluid" style={{ textDecoration: "none" }}>
        <h1
          style={{ color: "#1DB227", fontSize: "3em", marginBottom: "0.5em" }}
        >
          StreamYoink!
        </h1>
      </a>
      <p style={{ textAlign: "center", lineHeight: "1.5" }}>
        A game-in-a-frame made by the{" "}
        <a
          href="https://warpcast.com/superfluid"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#007bff", textDecoration: "none" }}
        >
          Superfluid
        </a>{" "}
        team.
        <br />
        Play{" "}
        <a
          href="https://warpcast.com/superfluid"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#007bff", textDecoration: "none" }}
        >
          StreamYoink
        </a>{" "}
        now and start earning 🎩$DEGEN every second.
      </p>
      {currentYoinker && (
        <div style={{ marginBottom: "20px" }}>
          <strong>Current Yoinker:</strong>{" "}
          <a
            href={`https://warpcast.com/${currentYoinker.profileHandle}`}
            style={{ color: "#007bff", textDecoration: "none" }}
          >
            @{currentYoinker.profileHandle}
          </a>
        </div>
      )}
      <table
        style={{
          borderCollapse: "collapse",
          width: "80%",
          maxWidth: "600px",
          borderColor: "white",
        }}
      >
        <thead style={{ backgroundColor: "white", color: "black" }}>
          <tr>
            <th
              style={{
                border: "1px solid white",
                textAlign: "center",
                padding: "8px",
              }}
            >
              Rank
            </th>
            <th
              style={{
                border: "1px solid white",
                textAlign: "center",
                padding: "8px",
              }}
            >
              User Handle
            </th>
            <th
              style={{
                border: "1px solid white",
                textAlign: "center",
                padding: "8px",
              }}
            >
              StreamYoinks
            </th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, index) => (
            <tr key={index}>
              <td
                style={{
                  border: "1px solid white",
                  textAlign: "center",
                  padding: "8px",
                }}
              >
                {index + 1}
              </td>
              <td
                style={{
                  border: "1px solid white",
                  textAlign: "center",
                  padding: "8px",
                }}
              >
                {entry.userHandle}
              </td>
              <td
                style={{
                  border: "1px solid white",
                  textAlign: "center",
                  padding: "8px",
                }}
              >
                {entry.score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <br />
      <div>
      <p style={{ textAlign: "center", lineHeight: "1.5" }}>
          <a
            href="https://github.com/youssefea/stream-yoink"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#007bff", textDecoration: "none" }}
          >
            📖 Github Repo Link
          </a>
        </p>
        <p>
          Inspired by{" "}
          <a
            href="https://warpcast.com/~/channel/yoink"
            target="_blank"
            rel="noopener noreferrer"
          >
            Yoink!
          </a>{" "}
          (
          <a
            href="https://warpcast.com/horsefacts.eth"
            target="_blank"
            rel="noopener noreferrer"
          >
            @horsefacts.eth
          </a>
          ) and made by{" "}
          <a
            href="https://warpcast.com/youssea"
            target="_blank"
            rel="noopener noreferrer"
          >
            @youssea
          </a>
        </p>
      </div>
    </div>
  );
}
