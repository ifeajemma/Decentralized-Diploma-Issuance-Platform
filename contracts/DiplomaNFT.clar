(define-non-fungible-token diploma-nft uint)

(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-ALREADY-MINTED u101)
(define-constant ERR-INVALID-ID u102)
(define-constant ERR-INVALID-DEGREE-TYPE u103)
(define-constant ERR-INVALID-GPA u104)
(define-constant ERR-INVALID-GRAD-DATE u105)
(define-constant ERR-INVALID-HONORS u106)
(define-constant ERR-INVALID-MAJOR u107)
(define-constant ERR-INVALID-MINOR u108)
(define-constant ERR-INVALID-TRANSCRIPT-HASH u109)
(define-constant ERR-REVOKED u110)
(define-constant ERR-NOT-OWNER u111)
(define-constant ERR-INVALID-METADATA u112)
(define-constant ERR-MAX-DIPLOMAS-EXCEEDED u113)
(define-constant ERR-INVALID-UPDATE-PARAM u114)
(define-constant ERR-UPDATE-NOT-ALLOWED u115)
(define-constant ERR-INVALID-ISSUER u116)
(define-constant ERR-INVALID-RECIPIENT u117)
(define-constant ERR-INVALID-STATUS u118)
(define-constant ERR-AUTHORITY-NOT-VERIFIED u119)
(define-constant ERR-INVALID-FIELD-OF-STUDY u120)
(define-constant ERR-INVALID-CREDIT-HOURS u121)
(define-constant ERR-INVALID-THESIS-TITLE u122)
(define-constant ERR-INVALID-ADVISOR u123)
(define-constant ERR-INVALID-AWARDS u124)
(define-constant ERR-INVALID-VERIFICATION-LEVEL u125)

(define-data-var last-token-id uint u0)
(define-data-var max-diplomas uint u1000000)
(define-data-var mint-fee uint u500)
(define-data-var authority-contract (optional principal) none)

(define-map diploma-metadata
  { token-id: uint }
  {
    university: principal,
    degree-type: (string-ascii 50),
    gpa: uint,
    graduation-date: uint,
    honors: (string-ascii 50),
    major: (string-ascii 100),
    minor: (optional (string-ascii 100)),
    transcript-hash: (buff 32),
    status: bool,
    field-of-study: (string-ascii 100),
    credit-hours: uint,
    thesis-title: (optional (string-ascii 200)),
    advisor: (optional principal),
    awards: (list 5 (string-ascii 50)),
    verification-level: uint
  }
)

(define-map diploma-updates
  { token-id: uint }
  {
    update-degree-type: (string-ascii 50),
    update-gpa: uint,
    update-timestamp: uint,
    updater: principal
  }
)

(define-read-only (get-diploma (id uint))
  (map-get? diploma-metadata { token-id: id })
)

(define-read-only (get-diploma-updates (id uint))
  (map-get? diploma-updates { token-id: id })
)

(define-read-only (get-owner (id uint))
  (nft-get-owner? diploma-nft id)
)

(define-private (validate-degree-type (degree (string-ascii 50)))
  (if (and (> (len degree) u0) (<= (len degree) u50))
      (ok true)
      (err ERR-INVALID-DEGREE-TYPE))
)

(define-private (validate-gpa (gpa uint))
  (if (and (>= gpa u0) (<= gpa u400))
      (ok true)
      (err ERR-INVALID-GPA))
)

(define-private (validate-graduation-date (date uint))
  (if (> date u0)
      (ok true)
      (err ERR-INVALID-GRAD-DATE))
)

(define-private (validate-honors (honors (string-ascii 50)))
  (if (<= (len honors) u50)
      (ok true)
      (err ERR-INVALID-HONORS))
)

(define-private (validate-major (major (string-ascii 100)))
  (if (and (> (len major) u0) (<= (len major) u100))
      (ok true)
      (err ERR-INVALID-MAJOR))
)

(define-private (validate-minor (minor (optional (string-ascii 100))))
  (match minor m
    (if (<= (len m) u100) (ok true) (err ERR-INVALID-MINOR))
    (ok true))
)

(define-private (validate-transcript-hash (hash (buff 32)))
  (if (is-eq (len hash) u32)
      (ok true)
      (err ERR-INVALID-TRANSCRIPT-HASH))
)

(define-private (validate-field-of-study (field (string-ascii 100)))
  (if (<= (len field) u100)
      (ok true)
      (err ERR-INVALID-FIELD-OF-STUDY))
)

(define-private (validate-credit-hours (hours uint))
  (if (and (>= hours u0) (<= hours u300))
      (ok true)
      (err ERR-INVALID-CREDIT-HOURS))
)

(define-private (validate-thesis-title (title (optional (string-ascii 200))))
  (match title t
    (if (<= (len t) u200) (ok true) (err ERR-INVALID-THESIS-TITLE))
    (ok true))
)

(define-private (validate-advisor (advisor (optional principal)))
  (ok true)
)

(define-private (validate-awards (awards (list 5 (string-ascii 50))))
  (if (<= (len awards) u5)
      (ok true)
      (err ERR-INVALID-AWARDS))
)

(define-private (validate-verification-level (level uint))
  (if (<= level u5)
      (ok true)
      (err ERR-INVALID-VERIFICATION-LEVEL))
)

(define-private (validate-principal (p principal))
  (if (not (is-eq p tx-sender))
      (ok true)
      (err ERR-NOT-AUTHORIZED))
)

(define-public (set-authority-contract (contract-principal principal))
  (begin
    (try! (validate-principal contract-principal))
    (asserts! (is-none (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set authority-contract (some contract-principal))
    (ok true)
  )
)

(define-public (set-max-diplomas (new-max uint))
  (begin
    (asserts! (> new-max u0) (err ERR-INVALID-UPDATE-PARAM))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set max-diplomas new-max)
    (ok true)
  )
)

(define-public (set-mint-fee (new-fee uint))
  (begin
    (asserts! (>= new-fee u0) (err ERR-INVALID-UPDATE-PARAM))
    (asserts! (is-some (var-get authority-contract)) (err ERR-AUTHORITY-NOT-VERIFIED))
    (var-set mint-fee new-fee)
    (ok true)
  )
)

(define-public (mint-diploma 
  (recipient principal) 
  (degree-type (string-ascii 50)) 
  (gpa uint) 
  (graduation-date uint)
  (honors (string-ascii 50))
  (major (string-ascii 100))
  (minor (optional (string-ascii 100)))
  (transcript-hash (buff 32))
  (field-of-study (string-ascii 100))
  (credit-hours uint)
  (thesis-title (optional (string-ascii 200)))
  (advisor (optional principal))
  (awards (list 5 (string-ascii 50)))
  (verification-level uint)
)
  (let (
        (token-id (+ (var-get last-token-id) u1))
        (current-max (var-get max-diplomas))
        (authority (var-get authority-contract))
      )
    (asserts! (< (var-get last-token-id) current-max) (err ERR-MAX-DIPLOMAS-EXCEEDED))
    (asserts! (contract-call? .UniversityRegistry is-university-authorized tx-sender) (err ERR-NOT-AUTHORIZED))
    (try! (validate-degree-type degree-type))
    (try! (validate-gpa gpa))
    (try! (validate-graduation-date graduation-date))
    (try! (validate-honors honors))
    (try! (validate-major major))
    (try! (validate-minor minor))
    (try! (validate-transcript-hash transcript-hash))
    (try! (validate-field-of-study field-of-study))
    (try! (validate-credit-hours credit-hours))
    (try! (validate-thesis-title thesis-title))
    (try! (validate-advisor advisor))
    (try! (validate-awards awards))
    (try! (validate-verification-level verification-level))
    (let ((authority-recipient (unwrap! authority (err ERR-AUTHORITY-NOT-VERIFIED))))
      (try! (stx-transfer? (var-get mint-fee) tx-sender authority-recipient))
    )
    (try! (nft-mint? diploma-nft token-id recipient))
    (map-set diploma-metadata { token-id: token-id }
      {
        university: tx-sender,
        degree-type: degree-type,
        gpa: gpa,
        graduation-date: graduation-date,
        honors: honors,
        major: major,
        minor: minor,
        transcript-hash: transcript-hash,
        status: true,
        field-of-study: field-of-study,
        credit-hours: credit-hours,
        thesis-title: thesis-title,
        advisor: advisor,
        awards: awards,
        verification-level: verification-level
      }
    )
    (var-set last-token-id token-id)
    (print { event: "diploma-minted", id: token-id })
    (ok token-id)
  )
)

(define-public (transfer-diploma (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) (err ERR-NOT-AUTHORIZED))
    (asserts! (is-eq (unwrap! (nft-get-owner? diploma-nft token-id) (err ERR-INVALID-ID)) sender) (err ERR-NOT-OWNER))
    (nft-transfer? diploma-nft token-id sender recipient)
  )
)

(define-public (burn-diploma (token-id uint))
  (let ((owner (unwrap! (nft-get-owner? diploma-nft token-id) (err ERR-INVALID-ID))))
    (asserts! (is-eq tx-sender owner) (err ERR-NOT-OWNER))
    (nft-burn? diploma-nft token-id owner)
  )
)

(define-public (update-diploma
  (token-id uint)
  (update-degree-type (string-ascii 50))
  (update-gpa uint)
)
  (let ((metadata (map-get? diploma-metadata { token-id: token-id })))
    (match metadata m
      (begin
        (asserts! (is-eq (get university m) tx-sender) (err ERR-NOT-AUTHORIZED))
        (asserts! (get status m) (err ERR-REVOKED))
        (try! (validate-degree-type update-degree-type))
        (try! (validate-gpa update-gpa))
        (map-set diploma-metadata { token-id: token-id }
          (merge m {
            degree-type: update-degree-type,
            gpa: update-gpa
          })
        )
        (map-set diploma-updates { token-id: token-id }
          {
            update-degree-type: update-degree-type,
            update-gpa: update-gpa,
            update-timestamp: block-height,
            updater: tx-sender
          }
        )
        (print { event: "diploma-updated", id: token-id })
        (ok true)
      )
      (err ERR-INVALID-ID)
    )
  )
)

(define-public (revoke-diploma (token-id uint))
  (let ((metadata (map-get? diploma-metadata { token-id: token-id })))
    (match metadata m
      (begin
        (asserts! (is-eq (get university m) tx-sender) (err ERR-NOT-AUTHORIZED))
        (map-set diploma-metadata { token-id: token-id }
          (merge m { status: false })
        )
        (print { event: "diploma-revoked", id: token-id })
        (ok true)
      )
      (err ERR-INVALID-ID)
    )
  )
)

(define-read-only (is-diploma-valid (token-id uint))
  (match (map-get? diploma-metadata { token-id: token-id })
    m (ok (get status m))
    (err ERR-INVALID-ID)
  )
)

(define-read-only (get-diploma-count)
  (ok (var-get last-token-id))
)