import { useState, useEffect, useCallback } from 'react';
import { GarameGameState, GaramePlayerState } from '../garame-types';
import { GameRoom } from '../../../core/types';
import { globalEventBus } from '../../../core/event-bus';
import { gameStore } from '../../../core/game-store';
import { useGameEngine } from '../../../hooks/use-game-engine';

export function useGarameGame(roomId: string) {
  const { engine, executeAction } = useGameEngine('garame');
  const [gameState, setGameState] = useState<GarameGameState | null>(null);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<GaramePlayerState | null>(null);
  const [opponentPlayer, setOpponentPlayer] = useState<GaramePlayerState | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);

  // Load room and game state
  useEffect(() => {
    const loadGame = async () => {
      const roomData = await gameStore.getRoom(roomId);
      if (roomData) {
        setRoom(roomData);
        
        if (roomData.gameStateId) {
          const state = await gameStore.getGameState(roomData.gameStateId);
          if (state) {
            setGameState(state as GarameGameState);
          }
        }
      }
    };

    loadGame();
  }, [roomId]);

  // Update player states when game state changes
  useEffect(() => {
    if (!gameState) return;

    const updatePlayerStates = async () => {
      const player = await gameStore.getCurrentPlayer();
      const myPlayerState = gameState.players.get(player.id) as GaramePlayerState;
      const opponentId = Array.from(gameState.players.keys()).find(id => id !== player.id);
      const opponentState = opponentId ? gameState.players.get(opponentId) as GaramePlayerState : null;

      setCurrentPlayer(myPlayerState);
      setOpponentPlayer(opponentState);
      setIsMyTurn(gameState.currentPlayerId === player.id);
    };

    updatePlayerStates();
  }, [gameState]);

  // Subscribe to game updates
  useEffect(() => {
    if (!room?.gameStateId) return;

    const handleGameUpdate = ({ gameState: newState }: any) => {
      setGameState(newState as GarameGameState);
    };

    globalEventBus.subscribe(`game.${room.gameStateId}.updated`, handleGameUpdate);

    return () => {
      globalEventBus.unsubscribe(`game.${room.gameStateId}.updated`, handleGameUpdate);
    };
  }, [room?.gameStateId]);

  const playCard = useCallback(async (cardIndex: number) => {
    if (!gameState || !currentPlayer || !isMyTurn) return;

    const card = currentPlayer.cards[cardIndex];
    const action = {
      type: 'play_card',
      playerId: currentPlayer.id,
      data: {
        cardIndex,
        card
      },
      timestamp: new Date()
    };

    const newState = await executeAction(gameState.id, action);
    setGameState(newState as GarameGameState);
  }, [gameState, currentPlayer, isMyTurn, executeAction]);

  const canPlayCard = useCallback((cardIndex: number): boolean => {
    if (!gameState || !currentPlayer || !isMyTurn) return false;

    // If player has Kora, they can play any card
    if (currentPlayer.hasKora) return true;

    const card = currentPlayer.cards[cardIndex];
    if (!card) return false;

    // If no card has been played this turn, any card is valid
    if (!gameState.lastPlayedCard) return true;

    // Must follow suit if possible
    const hasSuit = currentPlayer.cards.some(c => c.suit === gameState.currentSuit);
    if (hasSuit) {
      return card.suit === gameState.currentSuit;
    }

    // If no cards of the required suit, any card is valid
    return true;
  }, [gameState, currentPlayer, isMyTurn]);

  return {
    room,
    gameState,
    currentPlayer,
    opponentPlayer,
    isMyTurn,
    playCard,
    canPlayCard
  };
}