---- MODULE Lease ----
EXTENDS FiniteSets

CONSTANTS Ids

VARIABLES holders, intent

Init == holders = {} /\ intent = {}

BeginClaim(id) == intent' = {id} /\ UNCHANGED holders

FinishClaim(id) == id \in intent /\ holders' = holders \union {id} /\ intent' = {}

Release(id) == id \in holders /\ holders' = holders \ {id} /\ UNCHANGED intent

Use(id) == id \in holders /\ UNCHANGED <<holders, intent>>

Next == \E id \in Ids : BeginClaim(id) \/ FinishClaim(id) \/ Release(id) \/ Use(id)

SingleOwner == Cardinality(holders) <= 1
====
