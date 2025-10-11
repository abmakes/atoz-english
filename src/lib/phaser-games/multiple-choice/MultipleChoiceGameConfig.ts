import { GameConfig } from '@/lib/phaser-engine/config/GameConfig';

export const MULTIPLE_CHOICE_GAME_CONFIG: GameConfig = {
    // Quiz configuration
    quizId: '', // Will be set dynamically
    gameSlug: 'multiple-choice',
    intensityTimeLimit: 30000, // 30 seconds
    
    // Teams configuration
    teams: [
        { id: 'team1', name: 'Team 1', color: '#4299E1' },
        { id: 'team2', name: 'Team 2', color: '#48BB78' }
    ],
    
    // Game mode configuration
    gameMode: {
        type: 'score' as const,
        name: 'Score Mode',
        targetScore: 100
    },
    
    // Question handling configuration
    questionHandling: {
        distributionMode: 'sharedPool' as const,
        randomizeOrder: true,
        truncateForFairness: true
    },
    
    // Controls configuration
    controls: {
        actionMap: {
            'answer_1': { keyboard: 'KeyA' },
            'answer_2': { keyboard: 'KeyB' },
            'answer_3': { keyboard: 'KeyC' },
            'answer_4': { keyboard: 'KeyD' },
            'skip': { keyboard: 'Space' },
            'confirm': { keyboard: 'Enter' }
        },
        playerMappings: [
            { playerId: 'team1', deviceType: 'auto' },
            { playerId: 'team2', deviceType: 'auto' }
        ]
    },
    
    // Assets configuration
    assets: {
        bundles: [
            {
                name: 'ui',
                assets: [
                    { key: 'button-bg', src: '/images/ui/button-bg.png' },
                    { key: 'timer-bg', src: '/images/ui/timer-bg.png' }
                ]
            }
        ]
    },
    
    // Audio configuration
    audio: {
        basePath: '/sounds/',
        defaultVolume: 0.8,
        startMuted: false,
        sounds: [
            { id: 'correct-sound', filename: 'correct.mp3', type: 'sfx' },
            { id: 'incorrect-sound', filename: 'incorrect.mp3', type: 'sfx' },
            { id: 'timer-tick', filename: 'timer-tick.mp3', type: 'sfx' }
        ]
    },
    
    // Power-ups configuration
    powerups: {
        powerupsEnabled: true,
        availablePowerups: [
            {
                id: 'fifty_fifty',
                name: '50/50',
                description: 'Remove two incorrect answers',
                effectType: 'instant',
                effectParams: { removeCount: 2 }
            },
            {
                id: 'time_extension',
                name: 'Time Extension',
                description: 'Add extra time to the current question',
                effectType: 'instant',
                effectParams: { amount: 15 }
            },
            {
                id: 'double_points',
                name: 'Double Points',
                description: 'Double points for the next correct answer',
                durationSeconds: 1,
                effectType: 'persistent',
                effectParams: { multiplier: 2 }
            }
        ]
    },
    
    // Rules configuration
    rules: {
        rules: [
            {
                id: 'correct_answer_rule',
                description: 'Correct Answer Scoring',
                triggerEvent: 'answer_selected',
                conditions: [
                    { type: 'compareState', property: 'isCorrect', operator: 'eq', value: true }
                ],
                actions: [
                    { type: 'modifyScore', params: { target: 'active_team', value: 10 } }
                ]
            },
            {
                id: 'incorrect_answer_rule',
                description: 'Incorrect Answer Scoring',
                triggerEvent: 'answer_selected',
                conditions: [
                    { type: 'compareState', property: 'isCorrect', operator: 'eq', value: false }
                ],
                actions: [
                    { type: 'modifyScore', params: { target: 'active_team', value: 0 } }
                ]
            }
        ]
    }
};