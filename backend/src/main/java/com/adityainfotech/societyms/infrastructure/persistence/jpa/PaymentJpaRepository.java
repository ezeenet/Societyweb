package com.adityainfotech.societyms.infrastructure.persistence.jpa;
import com.adityainfotech.societyms.domain.entity.Payment;
import com.adityainfotech.societyms.domain.enums.ApprovalStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
@Repository
public interface PaymentJpaRepository extends JpaRepository<Payment, Long> {
    @EntityGraph(attributePaths = { "bill", "bill.flat", "bill.flat.wing", "member" })
    List<Payment> findAllByOrderByCreatedAtDesc();
    @EntityGraph(attributePaths = { "bill", "bill.flat", "bill.flat.wing", "member" })
    List<Payment> findByApprovalStatusOrderByCreatedAtDesc(ApprovalStatus status);
    @EntityGraph(attributePaths = { "bill", "bill.flat", "bill.flat.wing", "member" })
    List<Payment> findByMemberIdOrderByCreatedAtDesc(Long memberId);
    @EntityGraph(attributePaths = { "bill", "bill.flat", "bill.flat.wing", "member" })
    Optional<Payment> findById(Long id);
    boolean existsByBillIdAndApprovalStatusNot(Long billId, ApprovalStatus status);
    boolean existsByReceiptNumber(String receiptNumber);
    @Query("SELECT COALESCE(SUM(p.amountPaid), 0) FROM Payment p WHERE p.approvalStatus = 'APPROVED'")
    BigDecimal sumApprovedPayments();
    long countByApprovalStatus(ApprovalStatus status);
    @Query("""
        SELECT p FROM Payment p
        JOIN FETCH p.bill b
        JOIN FETCH b.flat f
        WHERE f.id = :flatId
          AND p.approvalStatus = 'APPROVED'
        ORDER BY p.paymentDate ASC
        """)
    List<Payment> findApprovedByFlatId(@Param("flatId") Long flatId);
    List<Payment> findByBillIdAndApprovalStatus(Long billId, ApprovalStatus approvalStatus);
    List<Payment> findByBillId(Long billId);
}