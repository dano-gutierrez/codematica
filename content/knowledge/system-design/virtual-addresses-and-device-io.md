---
title: Virtual Addresses And Device I/O — Check The Domain First
slug: system-design/virtual-addresses-and-device-io
summary: Translate original finite addresses, test mapping and permissions, distinguish fragmentation, and separate ordinary memory from device registers.
track: System Design
topic: Memory Domains
difficulty: practitioner
tags: [virtual-memory, paging, segmentation, mmio]
prerequisites: []
diagramRefs: []
sourceRefs: [boundary-ostep-paging, boundary-ostep-segments, boundary-linux-device-io]
status: published
---

## Preserve the page offset during translation

[OSTEP 1.10's paging chapter](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-paging.pdf) separates virtual page number and offset, then maps the page to a physical frame. For this original paper fixture, use a 64-byte virtual range and 16-byte pages. Virtual address 21 has page 1 and offset 5. If page 1 maps to frame 7, physical address is `7 * 16 + 5 = 117`.

Check boundary addresses independently: 15 is page0/offset15; 16 is page1/offset0; 63 is page3/offset15. Address 64 is outside the stated virtual range. The frame number changes while the offset stays fixed. These tiny ranges are exercise assumptions, not the page size, address width or layout of this Mac.

## Check presence and protection before access

Use a trusted fixture table: page0→frame3/read-write; page1→frame7/read-only; page2 absent; page3→frame2/read-write. A read at 21 translates to 117; a write at 21 is rejected; a read at 32 has no present mapping. Rejection produces no target access. Missing or inaccessible does not mean that physical address zero is a safe substitute.

Actual fault handling, backing storage, copy-on-write, TLBs and multi-level tables require hardware/OS-specific contracts. A missing resident mapping may be recoverable by the operating system; it is not always proof of an invalid program address. This fixture intentionally reports a missing mapping without implementing fault recovery.

## Keep the segment bound exclusive

[OSTEP's segmentation chapter](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-segmentation.pdf) describes base/bounds translation and variable-sized allocation. In this original upward-growing segment, physical base100 and exclusive length12 permit offsets0 through11. Offset11 maps to111; offset12 is rejected. Validate the logical offset and operation permission before adding the base.

Segmentation and paging are different translation/allocation choices, not universal mutually exclusive properties of every machine. An architecture can combine them. This exercise does not model downward-growing segments or modern hardware tables; it pins one small representation so that the off-by-one rule is reviewable.

## Name where unused space occurs

Packing 18 bytes into fixed16-byte pages occupies two pages and leaves14 unused bytes within the last page: internal fragmentation in this fixture. Variable-sized segments can instead leave separated free holes. Two holes of6 bytes each cannot satisfy one contiguous10-byte request without a different allocation/compaction policy, even though total free space is12.

Record the allocation unit, contiguity requirement, mapping overhead and access pattern before calling either method efficient. A page table has its own memory/work cost. These arithmetic counterexamples distinguish the contracts; they are not measured kernel performance or a universal policy recommendation.

## Treat device registers as a separate I/O domain

The [Linux device-I/O reference](https://docs.kernel.org/driver-api/device-io.html) explains platform accessors, `__iomem` tokens and ordering/posting constraints. Portable driver code uses the relevant mapping and I/O interfaces; ordinary pointer dereference or `memcpy` is not a portable register-access contract. A posted write may need the device-specific acknowledgement/flush rule before its effect is assumed complete.

Complete the [Memory Domain Checkpoint](/practice/system-design/virtual-addresses-and-device-io-checkpoint). On paper, annotate each operation as logical-address validation, translation, permission check, ordinary memory access or documented device operation. This lesson never maps device registers, dereferences arbitrary addresses or installs a driver; the arithmetic fixture is not a hardware implementation.
