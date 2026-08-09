#!/usr/bin/env python3
"""Generate the PostgreSQL seed for 2026 Stanley Cup Final Game 4.

Official result represented by the demo: Carolina Hurricanes 5, Vegas Golden
Knights 3, NHL game id 2025030414. The data mirrors game4Data.ts and keeps the
seed deterministic and idempotent.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "lib" / "db" / "seeds" / "game4-2025030414.sql"
GAME_ID = "2025030414"


def q(value: Any) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def js(value: Any) -> str:
    return q(json.dumps(value, separators=(",", ":"))) + "::jsonb"


def clock(seconds_remaining: int) -> str:
    seconds_remaining = max(0, seconds_remaining)
    return f"{seconds_remaining // 60:02d}:{seconds_remaining % 60:02d}"


car_players = [
    (20, "Sebastian", "Aho", "C", "L", 1094, 24, 3, 0, 1, 0, 5, 8, 1),
    (11, "Jordan", "Staal", "C", "L", 994, 25, 4, 2, 0, 0, 12, 4, 5),
    (22, "Logan", "Stankoven", "C", "R", 1014, 24, 3, 1, 0, 0, 3, 6, 2),
    (27, "Nikolaj", "Ehlers", "W", "L", 1149, 22, 3, 1, 2, 0, 2, 0, 6),
    (24, "Seth", "Jarvis", "W", "R", 1110, 24, 2, 0, 0, 0, 0, 2, 3),
    (74, "Jaccob", "Slavin", "D", "L", 1481, 32, 2, 0, 0, 0, 0, 0, 4),
    (4, "Shayne", "Gostisbehere", "D", "L", 782, 18, 1, 0, 1, 0, 0, 0, 7),
    (5, "Jalen", "Chatfield", "D", "R", 1371, 29, 1, 0, 1, 0, 0, 0, 4),
    (19, "K'Andre", "Miller", "D", "L", 1365, 32, 1, 0, 0, 2, 0, 0, 7),
    (21, "Alexander", "Nikishin", "D", "L", 613, 15, 0, 0, 0, 0, 0, 0, 2),
    (26, "Sean", "Walker", "D", "R", 1337, 32, 1, 0, 0, 0, 0, 0, 5),
    (28, "William", "Carrier", "W", "L", 503, 14, 0, 0, 0, 0, 1, 0, 4),
    (37, "Andrei", "Svechnikov", "W", "R", 776, 19, 0, 0, 0, 0, 0, 0, 2),
    (48, "Jordan", "Martinook", "W", "L", 828, 19, 1, 0, 0, 2, 0, 0, 3),
    (50, "Eric", "Robinson", "W", "L", 618, 14, 0, 0, 0, 0, 0, 0, 6),
    (53, "Jackson", "Blake", "W", "R", 914, 24, 3, 1, 1, 2, 0, 0, 7),
    (71, "Taylor", "Hall", "W", "L", 993, 25, 3, 0, 1, 2, 1, 0, 6),
    (77, "Mark", "Jankowski", "C", "L", 578, 14, 0, 0, 0, 0, 5, 2, 7),
    (32, "Brandon", "Bussi", "G", "L", 3600, 1, 0, 0, 0, 0, 0, 0, 1),
]

vgk_players = [
    # jersey, first, last, position, hand, SOG, G, A, PIM, FOW, FOL
    (3, "Brayden", "McNabb", "D", "L", 0, 0, 1, 2, 0, 0),
    (4, "Rasmus", "Andersson", "D", "R", 1, 0, 1, 0, 0, 0),
    (9, "Jack", "Eichel", "C", "R", 3, 0, 0, 0, 5, 6),
    (10, "Colton", "Sissons", "C", "R", 2, 0, 1, 0, 3, 3),
    (15, "Noah", "Hanifin", "D", "L", 1, 0, 0, 0, 0, 0),
    (16, "Pavel", "Dorofeyev", "W", "L", 2, 0, 0, 0, 0, 0),
    (21, "Brett", "Howden", "W", "L", 1, 1, 0, 0, 1, 0),
    (26, "Nic", "Dowd", "C", "R", 0, 0, 0, 2, 4, 4),
    (27, "Shea", "Theodore", "D", "L", 2, 0, 1, 2, 0, 0),
    (48, "Tomas", "Hertl", "C", "L", 2, 0, 0, 0, 5, 4),
    (49, "Ivan", "Barbashev", "W", "L", 1, 0, 0, 0, 0, 0),
    (55, "Keegan", "Kolesar", "W", "R", 0, 0, 0, 0, 0, 2),
    (61, "Mark", "Stone", "W", "R", 4, 1, 0, 0, 0, 1),
    (71, "William", "Karlsson", "C", "L", 1, 1, 1, 0, 4, 8),
    (93, "Mitch", "Marner", "W", "R", 0, 0, 1, 0, 0, 1),
]

goals = [
    (1, 66, "CAR", 22, "EV", "Stankoven from Chatfield and Blake"),
    (1, 208, "CAR", 53, "EV", "Blake from Hall and Ehlers"),
    (1, 442, "VGK", 61, "EV", "Stone from Theodore and McNabb"),
    (1, 768, "CAR", 11, "PP", "Staal power-play goal from Gostisbehere and Aho"),
    (2, 262, "VGK", 71, "EV", "Karlsson from Andersson and Marner"),
    (2, 1028, "VGK", 21, "EV", "Howden from Sissons and Karlsson"),
    (3, 392, "CAR", 11, "EV", "Staal from Ehlers"),
    (3, 1145, "CAR", 27, "EN", "Ehlers empty-net goal"),
]

penalties = [
    (1, 84, "VGK", 27, "Tripping — 2 min"),
    (1, 747, "VGK", None, "Bench minor — too many men — 2 min"),
    (1, 1052, "CAR", 71, "Slashing — 2 min"),
    (2, 690, "VGK", 26, "Cross-checking — 2 min"),
    (2, 860, "CAR", 48, "Interference — 2 min"),
    (2, 1110, "CAR", 53, "Goalkeeper interference — 2 min"),
    (2, 1110, "VGK", 3, "Cross-checking — 2 min"),
    (3, 102, "CAR", 19, "Tripping — 2 min"),
]

car_shots = [
    (1, 42, 20, "Shot on goal"), (1, 66, 22, "Goal"), (1, 158, 20, "Shot on goal"),
    (1, 199, 27, "Shot on goal"), (1, 208, 53, "Goal"), (1, 354, 22, "Shot on goal"),
    (1, 423, 5, "Shot on goal"), (1, 425, 11, "Shot on goal"), (1, 599, 24, "Shot on goal"),
    (1, 603, 74, "Shot on goal"), (1, 768, 11, "Power-play goal"), (1, 792, 71, "Shot on goal"),
    (1, 803, 22, "Shot on goal"), (1, 1178, 71, "Shot on goal"),
    (2, 92, 53, "Shot on goal"), (2, 191, 27, "Shot on goal"), (2, 485, 19, "Shot on goal"),
    (2, 554, 48, "Shot on goal"), (2, 609, 26, "Shot on goal"), (2, 628, 11, "Shot on goal"),
    (2, 735, 4, "Shot on goal"), (2, 1106, 53, "Shot on goal"), (2, 1192, 74, "Shot on goal"),
    (3, 352, 20, "Shot on goal"), (3, 384, 24, "Shot on goal"), (3, 392, 11, "Goal"),
    (3, 672, 71, "Shot on goal"), (3, 1145, 27, "Empty-net goal"),
]

vgk_shots = [
    (1, 133, 61, "Shot on goal"), (1, 442, 61, "Goal"), (1, 702, 48, "Shot on goal"),
    (1, 895, 9, "Shot on goal"), (1, 980, 48, "Shot on goal"), (1, 1162, 49, "Shot on goal"),
    (2, 262, 71, "Goal"), (2, 830, 9, "Shot on goal"), (2, 903, 9, "Shot on goal"),
    (2, 943, 61, "Shot on goal"), (2, 1028, 21, "Goal"), (2, 1152, 4, "Shot on goal"),
    (3, 67, 61, "Shot on goal"), (3, 95, 16, "Shot on goal"), (3, 97, 10, "Shot on goal"),
    (3, 157, 61, "Shot on goal"), (3, 436, 15, "Shot on goal"), (3, 573, 10, "Shot on goal"),
    (3, 890, 16, "Shot on goal"), (3, 1029, 27, "Shot on goal"), (3, 1147, 27, "Shot on goal"),
]

shifts = {
    20: [(36,60),(84,167),(262,300),(436,478),(675,704),(747,768),(841,898),(1090,1132),(1238,1277),(1393,1446),(1593,1633),(1725,1789),(1890,1949),(2147,2216),(2310,2354),(2400,2431),(2567,2631),(2706,2754),(2895,2937),(3094,3130),(3134,3180),(3291,3334),(3369,3409),(3545,3585)],
    11: [(0,36),(84,97),(208,253),(390,436),(567,613),(704,735),(747,768),(941,983),(1052,1090),(1200,1238),(1379,1393),(1549,1593),(1789,1848),(1890,1897),(2032,2147),(2354,2378),(2483,2566),(2754,2792),(2935,2994),(3130,3134),(3180,3214),(3238,3271),(3344,3369),(3461,3545),(3585,3600)],
    22: [(60,84),(167,208),(253,262),(300,359),(478,520),(613,674),(735,747),(768,810),(983,1052),(1179,1200),(1281,1331),(1446,1510),(1633,1685),(1848,1890),(1951,2025),(2216,2238),(2281,2310),(2431,2483),(2665,2706),(2833,2895),(3026,3094),(3271,3291),(3334,3344),(3411,3459)],
    27: [(0,31),(97,208),(391,442),(550,614),(704,735),(884,919),(970,998),(1200,1279),(1362,1393),(1550,1588),(1783,1830),(1897,2032),(2354,2400),(2400,2434),(2490,2502),(2751,2792),(2937,2991),(3122,3223),(3238,3275),(3344,3386),(3459,3545),(3585,3600)],
    24: [(0,34),(84,164),(406,442),(569,611),(704,740),(747,768),(973,1000),(1092,1132),(1200,1244),(1378,1393),(1531,1618),(1787,1831),(1890,1951),(2149,2228),(2310,2354),(2467,2502),(2567,2631),(2753,2792),(2938,2998),(3159,3213),(3238,3270),(3344,3376),(3456,3545),(3585,3600)],
    74: [(41,84),(253,297),(403,442),(475,505),(569,622),(704,736),(821,891),(1000,1036),(1092,1132),(1176,1200),(1239,1283),(1393,1426),(1462,1511),(1607,1681),(1688,1700),(1742,1801),(1849,1890),(2060,2150),(2228,2238),(2280,2354),(2381,2400),(2433,2475),(2502,2567),(2631,2657),(2752,2792),(2833,2898),(2992,3039),(3071,3109),(3180,3213),(3273,3337),(3370,3411),(3441,3545)],
}

clips = [
    ("faceoff", "Opening center-ice faceoff", "/videos/hockey-dashboard/faceoffs/opening-center-ice-faceoff.mp4", 0),
    ("faceoff", "Offensive-zone faceoff", "/videos/hockey-dashboard/faceoffs/offensive-zone-faceoff.mp4", 747),
    ("faceoff", "Center faceoff before Carolina goal", "/videos/hockey-dashboard/faceoffs/center-ice-faceoff-carolina-goal.mp4", 60),
    ("faceoff", "Center faceoff before Vegas goal", "/videos/hockey-dashboard/faceoffs/center-ice-faceoff-vegas-goal.mp4", 436),
    ("goal", "Carolina goal 1 — Logan Stankoven", "/videos/hockey-dashboard/goals/carolina-goal-1.mp4", 66),
    ("goal", "Carolina goal 2 — Jackson Blake", "/videos/hockey-dashboard/goals/carolina-goal-2.mp4", 208),
    ("goal", "Carolina goal 3 — Jordan Staal", "/videos/hockey-dashboard/goals/carolina-goal-3.mp4", 768),
    ("goal", "Vegas goal 1 — Mark Stone", "/videos/hockey-dashboard/goals/vegas-goal-1.mp4", 442),
    ("shot", "Sebastian Aho wrist shot", "/videos/hockey-dashboard/shots/sebastian-aho-wrist-shot.mp4", 42),
    ("shot", "Logan Stankoven backhand goal", "/videos/hockey-dashboard/shots/logan-stankoven-backhand-goal.mp4", 66),
    ("shot", "Jackson Blake wrist-shot goal", "/videos/hockey-dashboard/shots/jackson-blake-wrist-shot-goal.mp4", 208),
    ("shot", "Mark Stone breakaway goal", "/videos/hockey-dashboard/shots/mark-stone-breakaway-goal.mp4", 442),
    ("shot", "Jordan Staal rebound power-play goal", "/videos/hockey-dashboard/shots/jordan-staal-rebound-pp-goal.mp4", 768),
    ("shot", "Taylor Hall breakaway", "/videos/hockey-dashboard/shots/taylor-hall-breakaway.mp4", 792),
]


def player_ref(team: str, num: int | None) -> str:
    if num is None:
        return "NULL"
    return f"(SELECT id FROM nhl_players WHERE team_code={q(team)} AND jersey_number={num})"


lines: list[str] = []
add = lines.append
add("-- Generated by scripts/generate_game4_seed.py")
add("-- Carolina Hurricanes at Vegas Golden Knights, Stanley Cup Final Game 4, June 9 2026.")
add("BEGIN;\n")
add("INSERT INTO nhl_teams (code,name,city,abbreviation,logo_url,primary_color,secondary_color) VALUES")
add("  ('CAR','Carolina Hurricanes','Carolina','CAR','images/hockey-dashboard/canes.png','#CC0000','#FFFFFF'),")
add("  ('VGK','Vegas Golden Knights','Vegas','VGK','images/hockey-dashboard/vgk.png','#B4975A','#333F42')")
add("ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, city=EXCLUDED.city, logo_url=EXCLUDED.logo_url, primary_color=EXCLUDED.primary_color, secondary_color=EXCLUDED.secondary_color;\n")

add("INSERT INTO nhl_games (id,season,game_type,game_number,game_date,venue,away_team_code,home_team_code,away_score,home_score,status,period,clock_remaining_seconds,source,metadata) VALUES")
metadata = {
    "series": "Stanley Cup Final",
    "seriesGame": 4,
    "officialTotals": {
        "CAR": {"goals": 5, "shots": 28, "hits": 34, "blocks": 16, "giveaways": 15, "takeaways": 7, "pim": 8, "faceoffWins": 29, "faceoffs": 51, "ppGoals": 1, "ppOpps": 3},
        "VGK": {"goals": 3, "shots": 21, "hits": 38, "blocks": 12, "giveaways": 23, "takeaways": 3, "pim": 8, "faceoffWins": 22, "faceoffs": 51, "ppGoals": 0, "ppOpps": 3},
    },
}
add(f"  ({q(GAME_ID)},'2025-2026',3,4,'2026-06-09T20:00:00-07:00','T-Mobile Arena','CAR','VGK',5,3,'final',3,0,'NHL official Game Summary, Event Summary, Play-by-Play and TOI reports',{js(metadata)})")
add("ON CONFLICT (id) DO UPDATE SET away_score=EXCLUDED.away_score, home_score=EXCLUDED.home_score, status=EXCLUDED.status, metadata=EXCLUDED.metadata, updated_at=now();\n")

player_rows = []
for num, first, last, pos, hand, *_ in car_players:
    player_rows.append(("CAR", num, first, last, pos, hand))
for num, first, last, pos, hand, *_ in vgk_players:
    player_rows.append(("VGK", num, first, last, pos, hand))
add("INSERT INTO nhl_players (team_code,jersey_number,first_name,last_name,position,shoots_catches) VALUES")
add(",\n".join("  (" + ",".join(map(q, row)) + ")" for row in player_rows))
add("ON CONFLICT (team_code,jersey_number) DO UPDATE SET first_name=EXCLUDED.first_name,last_name=EXCLUDED.last_name,position=EXCLUDED.position,shoots_catches=EXCLUDED.shoots_catches,updated_at=now();\n")

add("INSERT INTO nhl_team_game_stats (game_id,team_code,goals,shots_on_goal,hits,blocks,takeaways,giveaways,penalty_minutes,faceoff_wins,faceoff_losses,power_play_goals,power_play_opportunities,advanced) VALUES")
add("  ('2025030414','CAR',5,28,34,16,7,15,8,29,22,1,3,'{\"shotShare\":57.1,\"faceoffPct\":56.9}'::jsonb),")
add("  ('2025030414','VGK',3,21,38,12,3,23,8,22,29,0,3,'{\"shotShare\":42.9,\"faceoffPct\":43.1}'::jsonb)")
add("ON CONFLICT (game_id,team_code) DO UPDATE SET goals=EXCLUDED.goals,shots_on_goal=EXCLUDED.shots_on_goal,hits=EXCLUDED.hits,blocks=EXCLUDED.blocks,takeaways=EXCLUDED.takeaways,giveaways=EXCLUDED.giveaways,penalty_minutes=EXCLUDED.penalty_minutes,faceoff_wins=EXCLUDED.faceoff_wins,faceoff_losses=EXCLUDED.faceoff_losses,power_play_goals=EXCLUDED.power_play_goals,power_play_opportunities=EXCLUDED.power_play_opportunities,advanced=EXCLUDED.advanced,updated_at=now();\n")

add("INSERT INTO nhl_player_game_stats (game_id,player_id,team_code,toi_seconds,shifts,goals,assists,points,shots_on_goal,penalty_minutes,faceoff_wins,faceoff_losses,saves,shots_against,advanced) VALUES")
stat_rows = []
for num, first, last, pos, hand, toi, n_shifts, sog, g, a, pim, fow, fol, face in car_players:
    saves, sa = (18, 21) if pos == "G" else (0, 0)
    adv = {"portraitAsset": f"face{face}.png", "official": True}
    stat_rows.append(f"  ({q(GAME_ID)},{player_ref('CAR', num)},'CAR',{toi},{n_shifts},{g},{a},{g+a},{sog},{pim},{fow},{fol},{saves},{sa},{js(adv)})")
for num, first, last, pos, hand, sog, g, a, pim, fow, fol in vgk_players:
    stat_rows.append(f"  ({q(GAME_ID)},{player_ref('VGK', num)},'VGK',0,0,{g},{a},{g+a},{sog},{pim},{fow},{fol},0,0,{js({'partial': True, 'source': 'official event and faceoff totals'})})")
add(",\n".join(stat_rows))
add("ON CONFLICT (game_id,player_id) DO UPDATE SET goals=EXCLUDED.goals,assists=EXCLUDED.assists,points=EXCLUDED.points,shots_on_goal=EXCLUDED.shots_on_goal,penalty_minutes=EXCLUDED.penalty_minutes,faceoff_wins=EXCLUDED.faceoff_wins,faceoff_losses=EXCLUDED.faceoff_losses,toi_seconds=EXCLUDED.toi_seconds,shifts=EXCLUDED.shifts,saves=EXCLUDED.saves,shots_against=EXCLUDED.shots_against,advanced=EXCLUDED.advanced,updated_at=now();\n")

# Event rows: goals count as shots, so duplicate goal-marked shot rows are excluded.
events = []
for period, t, team, num, strength, desc in goals:
    events.append(((period - 1) * 1200 + t, period, t, "goal", team, num, strength, desc, {"isShotOnGoal": True}))
for period, t, team, num, desc in penalties:
    events.append(((period - 1) * 1200 + t, period, t, "penalty", team, num, None, desc, {"minutes": 2}))
for team, shots in (("CAR", car_shots), ("VGK", vgk_shots)):
    for period, t, num, desc in shots:
        if desc.lower() in {"goal", "power-play goal", "empty-net goal"}:
            continue
        events.append(((period - 1) * 1200 + t, period, t, "shot", team, num, None, desc, {"isShotOnGoal": True}))
events.sort(key=lambda event: (event[0], {"goal": 0, "penalty": 1, "shot": 2}[event[3]], event[4]))
add("DELETE FROM nhl_game_events WHERE game_id='2025030414';")
add("INSERT INTO nhl_game_events (game_id,event_index,period,period_time_elapsed_seconds,game_time_elapsed_seconds,clock_remaining,event_type,team_code,strength,description,primary_player_id,metadata) VALUES")
event_rows = []
for idx, (elapsed, period, t, kind, team, num, strength, desc, meta) in enumerate(events, start=1):
    event_rows.append(
        f"  ({q(GAME_ID)},{idx},{period},{t},{elapsed},{q(clock(1200-t))},{q(kind)},{q(team)},{q(strength)},{q(desc)},{player_ref(team,num)},{js(meta)})"
    )
add(",\n".join(event_rows) + ";\n")

add("DELETE FROM nhl_player_shifts WHERE game_id='2025030414';")
add("INSERT INTO nhl_player_shifts (game_id,player_id,shift_number,period,start_game_seconds,end_game_seconds,duration_seconds,start_clock,end_clock,metadata) VALUES")
shift_rows = []
for num, intervals in shifts.items():
    for n, (start, end) in enumerate(intervals, start=1):
        period = min(3, start // 1200 + 1)
        start_in_period = start - (period - 1) * 1200
        end_period = min(3, max(0, end - 1) // 1200 + 1)
        end_in_period = end - (end_period - 1) * 1200
        shift_rows.append(
            f"  ({q(GAME_ID)},{player_ref('CAR',num)},{n},{period},{start},{end},{end-start},{q(clock(1200-start_in_period))},{q(clock(1200-end_in_period))},{js({'officialToiReport': True})})"
        )
add(",\n".join(shift_rows) + ";\n")

add("DELETE FROM nhl_video_clips WHERE game_id='2025030414';")
add("INSERT INTO nhl_video_clips (game_id,category,title,clip_url,start_game_seconds,end_game_seconds,tags,metadata) VALUES")
clip_rows = []
for category, title, url, at in clips:
    clip_rows.append(f"  ({q(GAME_ID)},{q(category)},{q(title)},{q(url)},{at},{min(3600,at+25)},{js([category,'game-4'])},{js({'bundled': True})})")
add(",\n".join(clip_rows) + ";\n")

insights = [
    ("opening-pressure", 42, None, 96, "game-state", "high", "Carolina established the first-shot advantage", "Aho generated the first shot on goal 42 seconds into the game. Keep the high forward press after neutral-zone wins.", ["shots-on-goal", "game-flow", "video-review"], {"player": 20, "eventSecond": 42}),
    ("staal-faceoff-edge", 768, None, 100, "faceoffs", "high", "Staal is controlling the decisive draws", "Jordan Staal finished 12–4 on faceoffs and converted the first-period power play. Prioritize him for defensive-zone and late-game draws.", ["head-to-head-faceoffs", "faceoff-win-rate", "offensive-zone-faceoff", "opening-faceoff"], {"wins": 12, "losses": 4, "faceoffPct": 75}),
    ("ehlers-impact", 2392, None, 91, "player-impact", "medium", "Ehlers is driving the second scoring layer", "Nikolaj Ehlers finished with three points and the empty-net goal while adding value on faceoffs.", ["player-impact", "game-points", "shots-on-goal"], {"goals": 1, "assists": 2, "points": 3}),
    ("protect-middle", 2228, 2580, 88, "defensive", "high", "Vegas has tied the game through the middle lane", "After Howden's equalizer, tighten the slot and force Vegas to the outside before the next offensive push.", ["shooting-by-sector", "lineup-analyzer", "recent-events"], {"score": "3-3", "eventSecond": 2228}),
    ("late-lead", 2792, None, 98, "game-state", "high", "Staal restored the lead", "With Carolina ahead 4–3, use the Staal line for defensive-zone starts and keep Slavin available for the next matchup.", ["player-toi", "lineup-analyzer", "faceoff-win-rate"], {"score": "4-3", "eventSecond": 2792}),
]
add("INSERT INTO nhl_coaching_insights (game_id,insight_key,available_at_game_seconds,expires_at_game_seconds,priority,category,severity,title,summary,related_widget_keys,payload) VALUES")
add(",\n".join(
    f"  ({q(GAME_ID)},{q(key)},{at},{q(exp)},{priority},{q(category)},{q(severity)},{q(title)},{q(summary)},{js(widgets)},{js(payload)})"
    for key, at, exp, priority, category, severity, title, summary, widgets, payload in insights
))
add("ON CONFLICT (game_id,insight_key) DO UPDATE SET available_at_game_seconds=EXCLUDED.available_at_game_seconds,expires_at_game_seconds=EXCLUDED.expires_at_game_seconds,priority=EXCLUDED.priority,category=EXCLUDED.category,severity=EXCLUDED.severity,title=EXCLUDED.title,summary=EXCLUDED.summary,related_widget_keys=EXCLUDED.related_widget_keys,payload=EXCLUDED.payload,updated_at=now();\n")

prefs = [
    ("Dashboard", "player-toi", 0, "wide", 100),
    ("Dashboard", "faceoff-win-rate", 1, "adaptive", 96),
    ("Dashboard", "shots-on-goal", 2, "adaptive", 94),
    ("Dashboard", "ai-insights", 3, "rail", 100),
    ("Player Insights", "faceoff-win-rate", 0, "wide", 100),
    ("Player Insights", "game-points", 1, "compact", 90),
    ("Player Insights", "player-impact", 2, "wide", 92),
    ("Player Insights", "shots-by-sector", 3, "medium", 88),
]
add("INSERT INTO nhl_widget_preferences (user_key,role,page,widget_key,visible,order_index,size_variant,priority,configuration) VALUES")
add(",\n".join(
    f"  ('demo-head-coach','head-coach',{q(page)},{q(key)},true,{order_idx},{q(size)},{priority},{js({'autoPack': True})})"
    for page, key, order_idx, size, priority in prefs
))
add("ON CONFLICT (user_key,page,widget_key) DO UPDATE SET visible=EXCLUDED.visible,order_index=EXCLUDED.order_index,size_variant=EXCLUDED.size_variant,priority=EXCLUDED.priority,configuration=EXCLUDED.configuration,updated_at=now();\n")

add("COMMIT;\n")
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote {OUT} ({OUT.stat().st_size:,} bytes, {len(events)} events, {sum(map(len, shifts.values()))} shifts)")
