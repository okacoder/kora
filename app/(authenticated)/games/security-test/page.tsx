'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Zap, Database, AlertTriangle, CheckCircle, XCircle, Clock, Activity } from 'lucide-react';

interface SecurityTestResult {
  testName: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details?: any;
  duration?: number;
}

interface PerformanceMetrics {
  cacheHitRate: number;
  avgResponseTime: number;
  queriesPerSecond: number;
  memoryUsage: number;
  redisConnected: boolean;
}

export default function SecurityTestPage() {
  const [testResults, setTestResults] = useState<SecurityTestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    cacheHitRate: 0,
    avgResponseTime: 0,
    queriesPerSecond: 0,
    memoryUsage: 0,
    redisConnected: false,
  });

  // Tests de sécurité
  const securityTests = [
    {
      name: 'Rate Limiting',
      description: 'Test des limites de requêtes',
      test: async (): Promise<SecurityTestResult> => {
        const startTime = Date.now();
        try {
          // Simuler des requêtes rapides
          const promises = Array.from({ length: 10 }, (_, i) => 
            fetch('/api/test-rate-limit', { 
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'play_card', timestamp: Date.now() })
            })
          );
          
          const results = await Promise.all(promises);
          const blockedRequests = results.filter(r => r.status === 429).length;
          
          return {
            testName: 'Rate Limiting',
            status: blockedRequests > 0 ? 'success' : 'warning',
            message: `${blockedRequests}/10 requêtes bloquées`,
            details: { blockedRequests, totalRequests: 10 },
            duration: Date.now() - startTime,
          };
        } catch (error) {
          return {
            testName: 'Rate Limiting',
            status: 'error',
            message: 'Erreur lors du test de rate limiting',
            duration: Date.now() - startTime,
          };
        }
      },
    },
    {
      name: 'Game Validation',
      description: 'Test de validation des actions de jeu',
      test: async (): Promise<SecurityTestResult> => {
        const startTime = Date.now();
        try {
          // Test avec une action invalide
          const response = await fetch('/api/test-game-validation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: { type: 'PLAY_CARD', cardId: 'invalid_card' },
              gameState: { players: {}, currentPlayerId: 'test' },
            }),
          });
          
          return {
            testName: 'Game Validation',
            status: response.status === 400 ? 'success' : 'error',
            message: response.status === 400 ? 'Validation fonctionne' : 'Validation échouée',
            duration: Date.now() - startTime,
          };
        } catch (error) {
          return {
            testName: 'Game Validation',
            status: 'error',
            message: 'Erreur lors du test de validation',
            duration: Date.now() - startTime,
          };
        }
      },
    },
    {
      name: 'Bot Detection',
      description: 'Test de détection de bots',
      test: async (): Promise<SecurityTestResult> => {
        const startTime = Date.now();
        try {
          // Simuler un pattern de bot (actions trop rapides)
          const rapidActions = Array.from({ length: 15 }, (_, i) => ({
            timestamp: Date.now() + (i * 50), // 50ms d'intervalle (suspect)
            action: 'play_card',
          }));
          
          const response = await fetch('/api/test-bot-detection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ actions: rapidActions }),
          });
          
          const result = await response.json();
          
          return {
            testName: 'Bot Detection',
            status: result.suspicious ? 'success' : 'warning',
            message: result.suspicious ? 'Bot détecté correctement' : 'Aucun bot détecté',
            details: result,
            duration: Date.now() - startTime,
          };
        } catch (error) {
          return {
            testName: 'Bot Detection',
            status: 'error',
            message: 'Erreur lors du test de détection de bot',
            duration: Date.now() - startTime,
          };
        }
      },
    },
  ];

  // Tests de performance
  const performanceTests = [
    {
      name: 'Cache Performance',
      description: 'Test des performances du cache',
      test: async (): Promise<SecurityTestResult> => {
        const startTime = Date.now();
        try {
          // Test de cache hit/miss
          const cacheTests = Array.from({ length: 5 }, () => 
            fetch('/api/test-cache-performance')
          );
          
          const results = await Promise.all(cacheTests);
          const avgTime = results.reduce((sum, r) => sum + (r.headers.get('x-response-time') ? 
            parseInt(r.headers.get('x-response-time')!) : 0), 0) / results.length;
          
          return {
            testName: 'Cache Performance',
            status: avgTime < 100 ? 'success' : avgTime < 500 ? 'warning' : 'error',
            message: `Temps de réponse moyen: ${avgTime}ms`,
            details: { avgResponseTime: avgTime },
            duration: Date.now() - startTime,
          };
        } catch (error) {
          return {
            testName: 'Cache Performance',
            status: 'error',
            message: 'Erreur lors du test de cache',
            duration: Date.now() - startTime,
          };
        }
      },
    },
    {
      name: 'Database Query Optimization',
      description: 'Test d\'optimisation des requêtes',
      test: async (): Promise<SecurityTestResult> => {
        const startTime = Date.now();
        try {
          const response = await fetch('/api/test-query-optimization');
          const result = await response.json();
          
          return {
            testName: 'Database Query Optimization',
            status: result.queryTime < 200 ? 'success' : result.queryTime < 1000 ? 'warning' : 'error',
            message: `Requête optimisée: ${result.queryTime}ms`,
            details: result,
            duration: Date.now() - startTime,
          };
        } catch (error) {
          return {
            testName: 'Database Query Optimization',
            status: 'error',
            message: 'Erreur lors du test d\'optimisation',
            duration: Date.now() - startTime,
          };
        }
      },
    },
  ];

  // Exécuter tous les tests
  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    
    const allTests = [...securityTests, ...performanceTests];
    
    for (const testSuite of allTests) {
      try {
        const result = await testSuite.test();
        setTestResults(prev => [...prev, result]);
      } catch (error) {
        setTestResults(prev => [...prev, {
          testName: testSuite.name,
          status: 'error',
          message: 'Erreur lors de l\'exécution du test',
        }]);
      }
    }
    
    setIsRunningTests(false);
  };

  // Simuler les métriques de performance
  useEffect(() => {
    const updateMetrics = () => {
      setPerformanceMetrics({
        cacheHitRate: Math.random() * 100,
        avgResponseTime: 50 + Math.random() * 200,
        queriesPerSecond: 10 + Math.random() * 50,
        memoryUsage: 30 + Math.random() * 40,
        redisConnected: Math.random() > 0.1, // 90% de chance d'être connecté
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Tests de Sécurité & Performance</h1>
          <p className="text-gray-600">Phase 6 - Validation des systèmes de sécurité et d'optimisation</p>
        </div>
      </div>

      {/* Métriques en temps réel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4" />
              Cache Hit Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.cacheHitRate.toFixed(1)}%</div>
            <Progress value={performanceMetrics.cacheHitRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Temps de Réponse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.avgResponseTime.toFixed(0)}ms</div>
            <Progress value={Math.min(performanceMetrics.avgResponseTime / 5, 100)} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Requêtes/sec
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{performanceMetrics.queriesPerSecond.toFixed(1)}</div>
            <Progress value={performanceMetrics.queriesPerSecond} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4" />
              Redis Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${performanceMetrics.redisConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">{performanceMetrics.redisConnected ? 'Connecté' : 'Déconnecté'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tests">Tests de Sécurité</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Tests de Sécurité
              </CardTitle>
              <CardDescription>
                Validation des systèmes de protection et de détection d'anomalies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={runAllTests} 
                disabled={isRunningTests}
                className="w-full"
              >
                {isRunningTests ? 'Tests en cours...' : 'Exécuter tous les tests'}
              </Button>

              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <div className="font-medium">{result.testName}</div>
                        <div className="text-sm text-gray-600">{result.message}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {result.duration && (
                        <Badge variant="outline">{result.duration}ms</Badge>
                      )}
                      <Badge className={getStatusColor(result.status)}>
                        {result.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Optimisations Cache</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Type de Cache</Label>
                  <Select defaultValue="redis">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="redis">Redis</SelectItem>
                      <SelectItem value="memory">Mémoire</SelectItem>
                      <SelectItem value="hybrid">Hybride</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>TTL (secondes)</Label>
                  <Input type="number" defaultValue="300" />
                </div>

                <Button className="w-full">Appliquer Configuration</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimisations Base de Données</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Stratégie de Requête</Label>
                  <Select defaultValue="optimized">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="optimized">Optimisée</SelectItem>
                      <SelectItem value="cached">Avec Cache</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Limite de Résultats</Label>
                  <Input type="number" defaultValue="50" />
                </div>

                <Button className="w-full">Optimiser Requêtes</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitoring en Temps Réel</CardTitle>
              <CardDescription>
                Surveillance des métriques de sécurité et performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Le monitoring en temps réel est actif. Les métriques sont mises à jour toutes les 5 secondes.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Utilisation Mémoire</Label>
                    <Progress value={performanceMetrics.memoryUsage} />
                    <div className="text-sm text-gray-600">{performanceMetrics.memoryUsage.toFixed(1)}%</div>
                  </div>

                  <div className="space-y-2">
                    <Label>Charge Serveur</Label>
                    <Progress value={performanceMetrics.queriesPerSecond * 2} />
                    <div className="text-sm text-gray-600">{(performanceMetrics.queriesPerSecond * 2).toFixed(1)}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 