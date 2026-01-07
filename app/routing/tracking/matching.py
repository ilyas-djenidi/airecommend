import numpy as np
import math
from typing import List, Dict, Tuple, Optional
from ..graph import RoadGraph, Node, Edge

class HMMMapMatcher:
    def __init__(self, road_graph: RoadGraph):
        self.road_graph = road_graph
        self.sigma_z = 10.0  # GPS noise std dev in meters
        self.beta = 50.0     # Transition probability param
        
    def _haversine_distance(self, p1, p2) -> float:
        # p1, p2 are dicts with 'lat', 'lon' or objects
        lat1, lon1 = (p1['lat'], p1['lon']) if isinstance(p1, dict) else (p1.lat, p1.lon)
        lat2, lon2 = (p2['lat'], p2['lon']) if isinstance(p2, dict) else (p2.lat, p2.lon)
        
        R = 6371000
        phi1, phi2 = math.radians(lat1), math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlambda = math.radians(lon2 - lon1)
        a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
        return 2 * R * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    def _project_point_on_segment(self, px, py, ux, uy, vx, vy):
        # Vector projection
        # P = U + t * (V - U)
        # Minimize |P - P_raw|
        l2 = (vx - ux)**2 + (vy - uy)**2
        if l2 == 0: return ux, uy, 0.0 # U and V are same
        t = ((px - ux) * (vx - ux) + (py - uy) * (vy - uy)) / l2
        t = max(0, min(1, t))
        proj_x = ux + t * (vx - ux)
        proj_y = uy + t * (vy - uy)
        return proj_x, proj_y, t

    def _find_candidates(self, gps_point, radius=50):
        # 1. Query spatial index for nearest nodes
        if not self.road_graph.spatial_index:
            self.road_graph.build_spatial_index()
            
        # Simplified: get k nearest nodes, then check edges connected to them
        # In robust impl, we'd index edges (R-tree). Here we approximate.
        dists, indexes = self.road_graph.spatial_index.query([gps_point['lat'], gps_point['lon']], k=10)
        
        candidates = []
        checked_edges = set()
        
        for idx in indexes:
            if idx >= len(self.road_graph.node_ids_ordered): continue
            node_id = self.road_graph.node_ids_ordered[idx]
            node = self.road_graph.nodes_dict[node_id]
            
            # Check all outgoing edges (and incoming if we had back-references)
            # Assuming undirected or check both for map matching usually
            for edge in node.out_edges:
                edge_sig = (edge.source.id, edge.target.id)
                if edge_sig in checked_edges: continue
                checked_edges.add(edge_sig)
                
                # Project point
                pj_lat, pj_lon, fraction = self._project_point_on_segment(
                    gps_point['lat'], gps_point['lon'],
                    edge.source.lat, edge.source.lon,
                    edge.target.lat, edge.target.lon
                )
                
                # Check distance
                dist = self._haversine_distance(gps_point, {'lat': pj_lat, 'lon': pj_lon})
                if dist <= radius:
                    candidates.append({
                        'edge': edge,
                        'projected_point': {'lat': pj_lat, 'lon': pj_lon},
                        'fraction': fraction,
                        'distance': dist
                    })
        return candidates

    def _emission_prob(self, gps_point, candidate):
        return (1 / (self.sigma_z * np.sqrt(2 * np.pi))) * \
               np.exp(-0.5 * (candidate['distance'] / self.sigma_z) ** 2)

    def _transition_prob(self, prev_candidate, curr_candidate, prev_gps, curr_gps):
        # Simplified road dist: usually requires shortest path on graph between projected points
        # Here we approximate: if same edge => diff in fraction * len
        # if touching edges => dist
        # else => infinite
        
        # Heuristic Network Distance
        if prev_candidate['edge'] == curr_candidate['edge']:
            road_dist = abs(curr_candidate['fraction'] - prev_candidate['fraction']) * prev_candidate['edge'].length_meters
        elif prev_candidate['edge'].target == curr_candidate['edge'].source:
            # Connected
            d1 = (1 - prev_candidate['fraction']) * prev_candidate['edge'].length_meters
            d2 = curr_candidate['fraction'] * curr_candidate['edge'].length_meters
            road_dist = d1 + d2
        else:
            # Assume a penalty distance if not directly connected (or calculate shortest path)
            # This is the heavy part of HMM matching
            road_dist = self._haversine_distance(prev_candidate['projected_point'], curr_candidate['projected_point']) * 1.5 
            
        gps_dist = self._haversine_distance(prev_gps, curr_gps)
        diff = abs(road_dist - gps_dist)
        return (1 / self.beta) * np.exp(-diff / self.beta)

    def viterbi_map_match(self, gps_trace: List[Dict]):
        if not gps_trace: return []
        
        candidates_list = []
        for gps in gps_trace:
            cands = self._find_candidates(gps, radius=50)
            if not cands:
                # Fallback: just use nearest node if no edge found
                cands = [{'edge': None, 'projected_point': gps, 'fraction': 0, 'distance': 0}]
            candidates_list.append(cands)
            
        T = len(gps_trace)
        # Handle cases where some steps have no candidates? handled by fallback above
        
        # Max candidates size
        N = max(len(c) for c in candidates_list)
        viterbi = np.zeros((T, N))
        backpointer = np.zeros((T, N), dtype=int)
        
        # Init
        for j, cand in enumerate(candidates_list[0]):
            viterbi[0, j] = self._emission_prob(gps_trace[0], cand)
            
        # Recursive
        for t in range(1, T):
            for j, curr in enumerate(candidates_list[t]):
                max_prob = -1.0
                best_prev = 0
                
                for i, prev in enumerate(candidates_list[t-1]):
                    trans = self._transition_prob(prev, curr, gps_trace[t-1], gps_trace[t])
                    prob = viterbi[t-1, i] * trans
                    if prob > max_prob:
                        max_prob = prob
                        best_prev = i
                
                emit = self._emission_prob(gps_trace[t], curr)
                viterbi[t, j] = max_prob * emit
                backpointer[t, j] = best_prev
                
        # Backtrack
        # Best last state
        best_last_idx = np.argmax(viterbi[T-1, :len(candidates_list[T-1])])
        best_path = []
        curr_idx = best_last_idx
        
        for t in range(T-1, -1, -1):
            cand = candidates_list[t][curr_idx]
            best_path.append(cand['projected_point'])
            curr_idx = backpointer[t, curr_idx]
            
        return best_path[::-1]

class ParticleFilterTracker:
    def __init__(self, road_graph, num_particles=100):
        self.road_graph = road_graph
        self.num_particles = num_particles
        self.particles = [] 
        self.weights = np.ones(num_particles) / num_particles
        
    def initialize(self, gps_point):
        matcher = HMMMapMatcher(self.road_graph)
        candidates = matcher._find_candidates(gps_point, radius=50)
        
        self.particles = []
        if not candidates:
            # Fallback random
            for _ in range(self.num_particles):
                 self.particles.append({'lat': gps_point['lat'], 'lon': gps_point['lon'], 'speed': 0})
            return

        for _ in range(self.num_particles):
            cand = np.random.choice(candidates) # Uniform choice
            p = {
                'edge': cand['edge'],
                'fraction': max(0, min(1, cand['fraction'] + np.random.normal(0, 0.05))),
                'speed': np.random.uniform(0, 60), # km/h
                'lat': cand['projected_point']['lat'], # approximate, should calc from fraction
                'lon': cand['projected_point']['lon']
            }
            self.particles.append(p)

    def update(self, gps_point, dt):
        matcher = HMMMapMatcher(self.road_graph)
        
        # Predict
        for p in self.particles:
            if 'edge' not in p or p['edge'] is None: continue
            
            dist_m = (p['speed'] * 1000 / 3600) * dt
            # Move along edge (simplified linear)
            # Need to update fraction
            edge_len = p['edge'].length_meters
            p['fraction'] += (dist_m / edge_len) if edge_len > 0 else 0
            
            # Recalc lat/lon
            s, t = p['edge'].source, p['edge'].target
            p['lat'] = s.lat + p['fraction'] * (t.lat - s.lat)
            p['lon'] = s.lon + p['fraction'] * (t.lon - s.lon)
            
            # Process noise
            p['lat'] += np.random.normal(0, 0.0001)
            p['lon'] += np.random.normal(0, 0.0001)

        # Update Weights
        total_w = 0
        for i, p in enumerate(self.particles):
            dist = matcher._haversine_distance(p, gps_point)
            w = np.exp(-0.5 * (dist / 15)**2)
            self.weights[i] = w
            total_w += w
            
        if total_w > 0:
            self.weights /= total_w
        else:
            self.weights = np.ones(self.num_particles) / self.num_particles
            
        # Resample logic omitted for brevity (SIR usually)

    def get_estimate(self):
        # Weighted average
        avg_lat = np.average([p['lat'] for p in self.particles], weights=self.weights)
        avg_lon = np.average([p['lon'] for p in self.particles], weights=self.weights)
        return {'lat': avg_lat, 'lon': avg_lon}
