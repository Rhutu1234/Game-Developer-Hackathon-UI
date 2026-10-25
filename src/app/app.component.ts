import { Component, ChangeDetectionStrategy, Injectable, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, delay, map } from 'rxjs/operators';

export interface PitchLocation {
    x: number;
    y: number;
}

export interface MatchEvent {
    id: string;
    minute: number;
    second: number;
    team: string;
    player: string;
    type: 'Pass' | 'Shot' | 'Tackle' | 'Interception' | 'Foul' | 'Dribble';
    location: PitchLocation;
    endLocation?: PitchLocation;
    outcome: 'Successful' | 'Unsuccessful' | 'Goal' | 'Saved' | 'Off Target';
    expectedGoals?: number;
}

export interface TacticalAnalysisReport {
    homeTeam: string;
    awayTeam: string;
    homeXG: number;
    awayXG: number;
    highPressIndex: number;
    tacticalNarrative: string;
    keyTurningPoint: string;
}

export interface ChatMessage {
    sender: 'user' | 'agent';
    text: string;
    time: string;
}

// Client-side API Service Simulator / Real Web API Bridge
@Injectable({ providedIn: 'root' })
export class MatchIntelligenceApiService {
    private http = inject(HttpClient);
    // Use backend HTTPS endpoint where the API runs locally. Update port if your backend launch profile uses another port.
    private baseUrl = '/api/matchintelligence';

    // Try real API, fallback to local generation on error
    getSyntheticEvents(homeTeam: string, awayTeam: string, count: number): Observable<MatchEvent[]> {
        const url = `${this.baseUrl}/generate-events`;

        console.log("Called endpoint")
        return this.http.get<MatchEvent[]>(url, { params: { homeTeam, awayTeam, count: String(count) } }).pipe(
            catchError(() => of(this.generateLocalEvents(homeTeam, awayTeam, count)).pipe(delay(200)))
        );
    }

    analyzeMatchStream(homeTeam: string, awayTeam: string, events: MatchEvent[]): Observable<TacticalAnalysisReport> {
        const url = `${this.baseUrl}/analyze?homeTeam=${encodeURIComponent(homeTeam)}&awayTeam=${encodeURIComponent(awayTeam)}`;
        return this.http.post<TacticalAnalysisReport>(url, events).pipe(
            catchError(() => of(this.computeLocalReport(homeTeam, awayTeam, events)).pipe(delay(250)))
        );
    }

    askAgent(query: string, events: MatchEvent[]): Observable<string> {
        const url = `${this.baseUrl}/chat`;
        // Send PascalCase keys to match C# model and accept either Response or response in reply
        const body = { Query: query, Events: events } as any;
        return this.http.post<any>(url, body).pipe(
            map(r => (r && (r.Response || r.response)) || ''),
            catchError(() => of(`[Local Agent] Based on ${events.length} events: ${query.toLowerCase().includes('press') ? 'press concentrated on right flank.' : 'high spatial control.'}`).pipe(delay(200)))
        );
    }

    private computeLocalReport(homeTeam: string, awayTeam: string, events: MatchEvent[]): TacticalAnalysisReport {
        const homeXG = events.filter(e => e.team === homeTeam && e.expectedGoals).reduce((a, b) => a + (b.expectedGoals || 0), 0);
        const awayXG = events.filter(e => e.team === awayTeam && e.expectedGoals).reduce((a, b) => a + (b.expectedGoals || 0), 0);
        const pressIndex = Math.round((events.filter(e => e.location.x > 65).length / (events.length || 1)) * 100);
        const goals = events.filter(e => e.outcome === 'Goal');

        return {
            homeTeam,
            awayTeam,
            homeXG: Math.round(homeXG * 100) / 100,
            awayXG: Math.round(awayXG * 100) / 100,
            highPressIndex: pressIndex,
            tacticalNarrative: `${homeTeam} exerted intense high pressing (${pressIndex}% in final third). ${goals.length > 0 ? `Key conversion by ${goals[0].player} at min ${goals[0].minute}'.` : 'Goal conversion remained restricted.'}`,
            keyTurningPoint: goals.length > 0 ? `Min ${goals[0].minute}': Goal scored by ${goals[0].player} (${goals[0].team}).` : "Min 42': High central pressing sequence."
        };
    }

    private generateLocalEvents(homeTeam: string, awayTeam: string, count: number): MatchEvent[] {
        const playersHome = ['Saka', 'Odegaard', 'Havertz', 'Rice', 'Saliba'];
        const playersAway = ['Salah', 'Diaz', 'Nunez', 'Mac Allister', 'Van Dijk'];
        const eventTypes: MatchEvent['type'][] = ['Pass', 'Pass', 'Pass', 'Shot', 'Tackle', 'Interception'];
        const res: MatchEvent[] = [];
        console.log("called me")
        for (let i = 0; i < count; i++) {
            const isHome = Math.random() > 0.45;
            const team = isHome ? homeTeam : awayTeam;
            const playerList = isHome ? playersHome : playersAway;
            const player = playerList[Math.floor(Math.random() * playerList.length)];
            const type = eventTypes[Math.floor(Math.random() * eventTypes.length)];

            const minute = Math.floor((i / count) * 90);
            const second = Math.floor(Math.random() * 60);
            const startX = isHome ? Math.floor(Math.random() * 50) + 40 : Math.floor(Math.random() * 50) + 10;
            const startY = Math.floor(Math.random() * 90) + 5;

            let outcome: MatchEvent['outcome'] = 'Successful';
            let expectedGoals: number | undefined = undefined;

            if (type === 'Shot') {
                const dist = Math.sqrt(Math.pow(100 - startX, 2) + Math.pow(34 - startY, 2));
                expectedGoals = Math.max(0.02, Math.round((1 - dist / 60) * 100) / 100);
                outcome = Math.random() < 0.2 ? 'Goal' : (Math.random() < 0.5 ? 'Saved' : 'Off Target');
            } else if (type === 'Pass') {
                outcome = Math.random() > 0.2 ? 'Successful' : 'Unsuccessful';
            }

            res.push({
                id: 'ev-' + i + '-' + Date.now(),
                minute,
                second,
                team,
                player,
                type,
                location: { x: startX, y: startY },
                endLocation: type === 'Pass' ? { x: Math.min(100, startX + (Math.random() * 20 - 5)), y: Math.min(100, startY + (Math.random() * 20 - 10)) } : undefined,
                outcome,
                expectedGoals
            });
        }

        return res;
    }
}

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, FormsModule, HttpClientModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './app.component.html',
})
export class AppComponent {
    private apiService = inject(MatchIntelligenceApiService);

    homeTeam = 'Arsenal FC';
    awayTeam = 'Liverpool FC';
    eventCount = 50;
    userQuery = '';

    matchEvents = signal<MatchEvent[]>
        ([]);
    selectedEventType = signal<string>
        ('All');
    activeEvent = signal<MatchEvent | null>
        (null);
    isAnalyzing = signal<boolean>
        (false);
    analysisReport = signal<TacticalAnalysisReport | null>
        (null);

    chatMessages = signal<ChatMessage[]>
        ([
            { sender: 'agent', text: 'Ready! I am connected to the C# AI Agent. Fetch a stream or ask questions about tactics.', time: 'Just now' }
        ]);

        timelineMinute = signal<number>(90);
    isPlaying = signal<boolean>(false);
 
    // Playback speed: match minutes advanced per real second (90 min plays in ~15 s)
    private readonly playbackSpeed = 6;
    private rafId: number | null = null;
    private lastFrameTs = 0;
 
    togglePlay() {
        if (this.isPlaying()) {
            this.pause();
            return;
        }
        if (this.timelineMinute() >= 90) this.timelineMinute.set(0);
        this.isPlaying.set(true);
        this.lastFrameTs = performance.now();
        this.rafId = requestAnimationFrame(ts => this.tick(ts));
    }
 
    // User dragged the slider: stop playback and jump to that minute
    onScrub(value: number | string) {
        this.pause();
        this.timelineMinute.set(Math.min(90, Math.max(0, Number(value))));
    }
 
    private tick(ts: number) {
        const dt = (ts - this.lastFrameTs) / 1000;
        this.lastFrameTs = ts;
        const next = Math.min(90, this.timelineMinute() + dt * this.playbackSpeed);
        this.timelineMinute.set(next);
        if (next >= 90) {
            this.pause();
        } else {
            this.rafId = requestAnimationFrame(t => this.tick(t));
        }
    }
 
    private pause() {
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
        this.rafId = null;
        this.isPlaying.set(false);
    }
 
    ngOnDestroy() {
        this.pause();
    }

    filteredEvents = computed(() => {
        const filter = this.selectedEventType();
        const maxMin = this.timelineMinute();
        return this.matchEvents().filter(e =>
            e.minute <= maxMin &&
            (filter === 'All' ||
                (filter === 'Defensive' ? e.type !== 'Shot' && e.type !== 'Pass' : e.type === filter)));
    });

    // Top 6 players by action volume, stacked by Passes / Shots / Tackles (other defensive actions)
    playerActions = computed(() => {
        const map = new Map<string, { player: string; passes: number; shots: number; tackles: number; total: number }>();
        for (const e of this.matchEvents()) {
            const row = map.get(e.player) ?? { player: e.player, passes: 0, shots: 0, tackles: 0, total: 0 };
            if (e.type === 'Pass') row.passes++;
            else if (e.type === 'Shot') row.shots++;
            else row.tackles++;
            row.total++;
            map.set(e.player, row);
        }
        const rows = [...map.values()].sort((a, b) => b.total - a.total).slice(0, 6);
        const max = Math.max(1, ...rows.map(r => r.total));
        return rows.map(r => ({
            ...r,
            passPct: (r.passes / max) * 100,
            shotPct: (r.shots / max) * 100,
            tacklePct: (r.tackles / max) * 100
        }));
    });

    // Cumulative xG per team in 10-minute steps, as SVG polyline points (viewBox 0 0 200 100)
    xgTrend = computed(() => {
        const events = this.matchEvents();
        const steps = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
        const cum = (team: string) => steps.map(s =>
            events.filter(e => e.team === team && e.minute <= s).reduce((a, b) => a + (b.expectedGoals || 0), 0));
        const home = cum(this.homeTeam);
        const away = cum(this.awayTeam);
        const max = Math.max(0.8, ...home, ...away);
        const toPoints = (v: number[]) => v.map((y, i) => `${(i / (steps.length - 1)) * 200},${100 - (y / max) * 100}`).join(' ');
        return {
            max,
            home: toPoints(home),
            away: toPoints(away),
            homeArea: `0,100 ${toPoints(home)} 200,100`
        };
    });

    possession = computed(() => {
        const events = this.matchEvents().filter(e => e.type === 'Pass');
        if (!events.length) return 50;
        return Math.round((events.filter(e => e.team === this.homeTeam).length / events.length) * 100);
    });

    initials(team: string): string {
        return team.split(' ').filter(w => w.length > 2).map(w => w[0]).join('').slice(0, 3).toUpperCase() || team.slice(0, 2).toUpperCase();
    }

    constructor() {
        this.generateSyntheticData();
    }

    generateSyntheticData() {
        this.apiService.getSyntheticEvents(this.homeTeam, this.awayTeam, this.eventCount).subscribe(events => {
            this.matchEvents.set(events);
            // this.runAiAnalysis();
        });
    }

    runAiAnalysis() {
        this.isAnalyzing.set(true);
        this.apiService.analyzeMatchStream(this.homeTeam, this.awayTeam, this.matchEvents()).subscribe(report => {
            this.analysisReport.set(report);
            this.isAnalyzing.set(false);
        });
    }

    sendChatMessage() {
        if (!this.userQuery.trim()) return;

        const query = this.userQuery;
        this.userQuery = '';

        const newMsgs = [
            ...this.chatMessages(),
            { sender: 'user' as const, text: query, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        ];
        this.chatMessages.set(newMsgs);

        this.apiService.askAgent(query, this.matchEvents()).subscribe(reply => {
            this.chatMessages.set([
                ...this.chatMessages(),
                { sender: 'agent' as const, text: reply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
            ]);
        });
    }
}