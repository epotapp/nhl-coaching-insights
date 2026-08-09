#!/usr/bin/env python3
"""Generate the NHL Coaching Insights chart assets with Matplotlib.

The Game 4 charts use the official CAR–VGK totals and event timing stored in
`game4Data.ts`. Season/playoff trend charts are presentation-ready placeholders
whose data model can be replaced by PostgreSQL without changing the widgets.
"""
from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Sequence

import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts/mockup-sandbox/public/images/hockey-dashboard/charts"
OUT.mkdir(parents=True, exist_ok=True)

CAR_SHOT_MINUTES = np.array([
    .70, 1.10, 2.63, 3.32, 3.47, 5.90, 7.05, 7.08, 9.98, 10.05, 12.80,
    13.20, 13.38, 19.63, 21.53, 23.18, 28.08, 29.23, 30.15, 30.47, 32.25,
    38.43, 39.87, 45.87, 46.40, 46.53, 51.20, 59.08,
])
VGK_SHOT_MINUTES = np.array([
    2.22, 7.37, 11.70, 14.92, 16.33, 19.37, 24.37, 33.83, 35.05, 35.72,
    37.13, 39.20, 41.12, 41.58, 41.62, 42.62, 47.27, 49.55, 54.83, 57.15,
    59.12,
])

@dataclass(frozen=True)
class Theme:
    name: str
    background: str
    foreground: str
    muted: str
    grid: str
    blue: str
    blue2: str
    gold: str
    red: str

THEMES = (
    Theme("dark", "#1C212C", "#F9FBFD", "#8F96A3", "#303744", "#4186FF", "#8DB6FF", "#D2AE68", "#F06A7C"),
    Theme("light", "#F9FBFD", "#02060F", "#667080", "#DCE5EE", "#2155FC", "#6EA2FF", "#AF7C26", "#CC405A"),
)


def style_axis(ax: plt.Axes, theme: Theme, *, xlabel: str = "", ylabel: str = "") -> None:
    ax.set_facecolor(theme.background)
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.tick_params(colors=theme.muted, labelsize=9, length=0)
    ax.grid(True, axis="y", color=theme.grid, linewidth=.8, alpha=.95)
    ax.grid(False, axis="x")
    ax.set_axisbelow(True)
    if xlabel:
        ax.set_xlabel(xlabel, color=theme.muted, fontsize=9)
    if ylabel:
        ax.set_ylabel(ylabel, color=theme.muted, fontsize=9)


def save(fig: plt.Figure, base: str, theme: Theme) -> None:
    suffix = "" if theme.name == "dark" else "-light"
    fig.savefig(OUT / f"{base}{suffix}.png", dpi=160, bbox_inches="tight", facecolor=theme.background, pad_inches=.08)
    plt.close(fig)


def cumulative_step(times: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    x = np.r_[0, times, 60]
    y = np.r_[0, np.arange(1, len(times) + 1), len(times)]
    return x, y


def game_flow(theme: Theme) -> None:
    fig, ax = plt.subplots(figsize=(10.2, 4.45), facecolor=theme.background)
    style_axis(ax, theme, xlabel="Elapsed game time (minutes)", ylabel="Cumulative shots on goal")
    cx, cy = cumulative_step(CAR_SHOT_MINUTES)
    vx, vy = cumulative_step(VGK_SHOT_MINUTES)
    ax.step(cx, cy, where="post", color=theme.blue, linewidth=2.7, label="CAR")
    ax.step(vx, vy, where="post", color=theme.gold, linewidth=2.7, label="VGK")
    for boundary, label in ((20, "1ST"), (40, "2ND"), (59.6, "3RD")):
        if boundary < 59:
            ax.axvline(boundary, color=theme.grid, linewidth=1.1)
        ax.text(boundary - (10 if boundary < 59 else 9.5), 29.0, label, color=theme.muted, fontsize=9, ha="center")
    ax.text(59.3, 28.15, "28", color=theme.blue, fontsize=14, fontweight="bold", ha="right")
    ax.text(59.3, 21.15, "21", color=theme.gold, fontsize=14, fontweight="bold", ha="right")
    ax.set_xlim(0, 60)
    ax.set_ylim(0, 30.5)
    ax.legend(loc="upper left", frameon=False, labelcolor=theme.foreground, ncol=2, fontsize=10)
    fig.tight_layout()
    save(fig, "game-flow", theme)


def cumulative_points(theme: Theme) -> None:
    games = np.arange(1, 18)
    series = {
        "Aho": [1,2,3,4,5,6,6,8,9,10,11,12,13,14,15,16,19],
        "Ehlers": [0,1,2,3,4,5,6,7,8,9,10,11,12,13,13,14,16],
        "Staal": [0,1,1,2,2,3,4,4,5,6,7,8,9,10,10,11,13],
        "Blake": [0,1,2,2,3,4,5,6,6,7,8,9,10,11,12,13,15],
    }
    colors = [theme.blue, theme.blue2, theme.gold, theme.red]
    fig, ax = plt.subplots(figsize=(10.2, 4.55), facecolor=theme.background)
    style_axis(ax, theme, xlabel="2026 playoff games", ylabel="Cumulative points")
    for (label, values), color in zip(series.items(), colors):
        ax.plot(games, values, color=color, linewidth=2.2, label=label)
    ax.set_xticks([1,4,7,10,13,17])
    ax.set_ylim(0, 20.5)
    ax.legend(loc="upper left", frameon=False, labelcolor=theme.foreground, ncol=4, fontsize=9)
    fig.tight_layout()
    save(fig, "cumulative-points", theme)


def faceoff_centers(theme: Theme) -> None:
    players = ["Staal", "Aho", "Jankowski", "Stankoven", "Ehlers", "Hall", "Carrier", "Jarvis"]
    wins = np.array([12,5,5,3,2,1,1,0])
    losses = np.array([4,8,2,6,0,0,0,2])
    y = np.arange(len(players))[::-1]
    fig, ax = plt.subplots(figsize=(9.8, 4.55), facecolor=theme.background)
    style_axis(ax, theme, xlabel="Faceoffs taken")
    ax.grid(False, axis="y")
    ax.barh(y, wins, color=theme.blue, height=.54, label="Wins")
    ax.barh(y, losses, left=wins, color=theme.grid, height=.54, label="Losses")
    ax.set_yticks(y, labels=players, color=theme.muted)
    ax.set_xlim(0, 18)
    for yi, w, l in zip(y, wins, losses):
        ax.text(w + l + .25, yi, f"{w}-{l}", va="center", color=theme.muted, fontsize=8)
    ax.legend(loc="lower right", frameon=False, labelcolor=theme.foreground, ncol=2, fontsize=8)
    fig.tight_layout()
    save(fig, "faceoff-centers", theme)


def player_impact(theme: Theme) -> None:
    names = ["Ehlers", "Staal", "Blake", "Stankoven", "Aho", "Hall", "Slavin", "Jarvis"]
    shots = np.array([3,4,3,3,3,3,2,2])
    points = np.array([3,2,1,1,1,0,0,0])
    y = np.arange(len(names))[::-1]
    fig, ax = plt.subplots(figsize=(9.8, 4.55), facecolor=theme.background)
    style_axis(ax, theme)
    ax.grid(False, axis="y")
    ax.barh(y + .13, shots, color=theme.blue2, height=.26, label="Shots")
    ax.barh(y - .13, points, color=theme.blue, height=.26, label="Points")
    ax.set_yticks(y, labels=names, color=theme.muted)
    ax.set_xlim(0, 5)
    ax.legend(loc="lower right", frameon=False, labelcolor=theme.foreground, ncol=2, fontsize=8)
    fig.tight_layout()
    save(fig, "player-impact", theme)


def season_trends(theme: Theme) -> None:
    games = np.arange(1, 18)
    faceoff = np.array([51,52,51,55,47,50,54,52,56,49,53,55,52,54,56,55,57])
    shots = np.array([31,29,34,30,29,35,33,37,28,34,36,30,32,34,30,27,29])
    fig, ax = plt.subplots(figsize=(10.2, 4.55), facecolor=theme.background)
    style_axis(ax, theme, xlabel="2026 playoff games", ylabel="Faceoff win %")
    ax.plot(games, faceoff, color=theme.blue, linewidth=2.1, marker="o", markersize=2.6, label="Faceoff %")
    ax.set_ylim(44, 62)
    ax2 = ax.twinx()
    for spine in ax2.spines.values(): spine.set_visible(False)
    ax2.tick_params(colors=theme.muted, labelsize=9, length=0)
    ax2.plot(games, shots, color=theme.gold, linewidth=2.1, label="Shots")
    ax2.set_ylim(20, 42)
    ax2.set_ylabel("Shots on goal", color=theme.muted, fontsize=9)
    lines = ax.get_lines() + ax2.get_lines()
    ax.legend(lines, [line.get_label() for line in lines], loc="upper left", frameon=False, labelcolor=theme.foreground, ncol=2, fontsize=8)
    fig.tight_layout()
    save(fig, "season-trends", theme)


def shooting_sectors(theme: Theme) -> None:
    sectors = ["Slot", "Inner L", "Inner R", "Left flank", "Right flank", "Point"]
    values = [8,5,4,4,3,4]
    fig, ax = plt.subplots(figsize=(9.8, 4.55), facecolor=theme.background)
    style_axis(ax, theme, ylabel="Shots on goal")
    bars = ax.bar(sectors, values, color=theme.blue, width=.62)
    ax.set_ylim(0, 10)
    for bar, val in zip(bars, values):
        ax.text(bar.get_x() + bar.get_width()/2, val + .25, str(val), color=theme.foreground, fontsize=9, ha="center")
    fig.tight_layout()
    save(fig, "shooting-sectors", theme)


def team_comparison(theme: Theme) -> None:
    labels = ["Shots", "Faceoff wins", "Hits", "Blocks", "Takeaways", "Giveaways"]
    car = np.array([28,29,34,16,7,15])
    vgk = np.array([21,22,38,12,3,23])
    x = np.arange(len(labels)); width = .34
    fig, ax = plt.subplots(figsize=(10.2, 4.55), facecolor=theme.background)
    style_axis(ax, theme)
    a = ax.bar(x-width/2, car, width, color=theme.blue, label="CAR")
    b = ax.bar(x+width/2, vgk, width, color=theme.gold, label="VGK")
    ax.set_xticks(x, labels=labels)
    ax.set_ylim(0, 42)
    for bars in (a,b):
        for bar in bars:
            ax.text(bar.get_x()+bar.get_width()/2, bar.get_height()+.5, f"{int(bar.get_height())}", ha="center", color=theme.foreground, fontsize=8)
    ax.legend(loc="upper left", frameon=False, labelcolor=theme.foreground, ncol=2, fontsize=8)
    fig.tight_layout()
    save(fig, "team-comparison", theme)


def main() -> None:
    for theme in THEMES:
        game_flow(theme)
        cumulative_points(theme)
        faceoff_centers(theme)
        player_impact(theme)
        season_trends(theme)
        shooting_sectors(theme)
        team_comparison(theme)
    print(f"Generated {len(THEMES) * 7} chart assets in {OUT}")


if __name__ == "__main__":
    main()
