import random
import math
from typing import List, Tuple, Dict
import numpy as np

class LocalSearch:
    @staticmethod
    def two_opt(route: List[int], dist_matrix: Dict[Tuple[int, int], float]) -> List[int]:
        """
        Iterative 2-opt swap.
        """
        best_route = route
        improved = True
        
        def calculate_cost(r):
            c = 0
            for i in range(len(r) - 1):
                c += dist_matrix.get((r[i], r[i+1]), 0)
            return c

        best_cost = calculate_cost(route)

        while improved:
            improved = False
            for i in range(1, len(best_route) - 2):
                for j in range(i + 1, len(best_route) - 1):
                    if j - i == 1: continue
                    
                    new_route = best_route[:]
                    new_route[i:j] = best_route[j-1:i-1:-1] # Reverse segment
                    
                    # Quick cost check calc could be optimized to O(1) by only checking edges changed
                    # But for now calculating full cost for simplicity and correctness
                    new_cost = calculate_cost(new_route)
                    
                    if new_cost < best_cost:
                        best_route = new_route
                        best_cost = new_cost
                        improved = True
        return best_route

class AntColonyOptimization:
    def __init__(self, n_ants=10, alpha=1.0, beta=2.0, rho=0.1, q=100.0):
        self.n_ants = n_ants
        self.alpha = alpha # Pheromone importance
        self.beta = beta   # Distance importance
        self.rho = rho     # Evaporation
        self.q = q         # Pheromone deposit factor

    def solve(self, nodes: List[int], dist_matrix: Dict[Tuple[int, int], float], iterations=50) -> List[int]:
        n_nodes = len(nodes)
        node_indices = {node: i for i, node in enumerate(nodes)}
        index_nodes = {i: node for i, node in enumerate(nodes)}
        
        # Pheromone matrix
        pheromones = np.ones((n_nodes, n_nodes)) * 0.1
        
        # Distance matrix (numpy for speed)
        dists = np.zeros((n_nodes, n_nodes))
        for i in range(n_nodes):
            for j in range(n_nodes):
                if i != j:
                    u, v = index_nodes[i], index_nodes[j]
                    d = dist_matrix.get((u, v), 1e6)
                    dists[i][j] = d if d > 0 else 0.1
        
        # Visibility = 1 / distance
        visibility = 1.0 / dists
        np.fill_diagonal(visibility, 0)

        best_route = None
        best_dist = float('inf')

        for _ in range(iterations):
            all_tours = []
            
            for ant in range(self.n_ants):
                tour = [0] # Start at first node index
                visited = {0}
                
                current = 0
                while len(tour) < n_nodes:
                    probs = []
                    unvisited_indices = [i for i in range(n_nodes) if i not in visited]
                    
                    denom = 0.0
                    for j in unvisited_indices:
                        tau = pheromones[current][j] ** self.alpha
                        eta = visibility[current][j] ** self.beta
                        val = tau * eta
                        probs.append(val)
                        denom += val
                    
                    if denom == 0:
                        next_node = random.choice(unvisited_indices)
                    else:
                        probs = [p / denom for p in probs]
                        # Roulette wheel
                        r = random.random()
                        cum = 0
                        next_node = unvisited_indices[-1]
                        for idx, prob in enumerate(probs):
                            cum += prob
                            if r <= cum:
                                next_node = unvisited_indices[idx]
                                break
                    
                    tour.append(next_node)
                    visited.add(next_node)
                    current = next_node
                
                tour.append(0) # Return
                all_tours.append(tour)
                
                # Calculate dist
                dist = 0
                for i in range(len(tour)-1):
                    dist += dists[tour[i]][tour[i+1]]
                
                if dist < best_dist:
                    best_dist = dist
                    best_route = [index_nodes[i] for i in tour]

            # Evaporation
            pheromones *= (1 - self.rho)
            
            # Deposit
            for tour in all_tours:
                dist = sum(dists[tour[i]][tour[i+1]] for i in range(len(tour)-1))
                deposit = self.q / dist
                for i in range(len(tour)-1):
                    u, v = tour[i], tour[i+1]
                    pheromones[u][v] += deposit
                    pheromones[v][u] += deposit
        
        return best_route

class GeneticAlgorithm:
    def __init__(self, population_size=50, mutation_rate=0.1, generations=100):
        self.pop_size = population_size
        self.mutation_rate = mutation_rate
        self.generations = generations

    def solve(self, nodes: List[int], dist_matrix: Dict[Tuple[int, int], float]) -> List[int]:
        # Simple GA for TSP
        # Genes = List of node IDs (excluding start/end)
        start_node = nodes[0]
        points = nodes[1:]
        
        population = []
        for _ in range(self.pop_size):
            p = points[:]
            random.shuffle(p)
            population.append(p)
            
        def fitness(individual):
            route = [start_node] + individual + [start_node]
            d = 0
            for i in range(len(route)-1):
                d += dist_matrix.get((route[i], route[i+1]), 1e6)
            return 1.0 / d
            
        for _ in range(self.generations):
            pop_fitness = [(fitness(ind), ind) for ind in population]
            pop_fitness.sort(key=lambda x: x[0], reverse=True)
            
            # Elitism
            next_pop = [pop_fitness[0][1], pop_fitness[1][1]]
            
            while len(next_pop) < self.pop_size:
                # Tournament Selection
                p1 = self._tournament(pop_fitness)
                p2 = self._tournament(pop_fitness)
                
                # Crossover (Order Crossover)
                child = self._ox_crossover(p1, p2)
                
                # Mutation
                if random.random() < self.mutation_rate:
                    self._swap_mutation(child)
                    
                next_pop.append(child)
            
            population = next_pop
            
        best = max(population, key=fitness)
        return [start_node] + best + [start_node]

    def _tournament(self, pop_fitness):
        k = 3
        candidates = random.sample(pop_fitness, k)
        return max(candidates, key=lambda x: x[0])[1]

    def _ox_crossover(self, p1, p2):
        size = len(p1)
        start = random.randint(0, size - 2)
        end = random.randint(start + 1, size - 1)
        
        child = [None] * size
        child[start:end] = p1[start:end]
        
        current_p2_idx = 0
        for i in range(size):
            if child[i] is None:
                while p2[current_p2_idx] in child:
                    current_p2_idx += 1
                child[i] = p2[current_p2_idx]
        return child

    def _swap_mutation(self, ind):
        i, j = random.sample(range(len(ind)), 2)
        ind[i], ind[j] = ind[j], ind[i]
