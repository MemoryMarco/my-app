package com.liuyansh.repository;
import com.liuyansh.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    List<Message> findByTsAfter(Instant timestamp);
    @Query("SELECT m FROM Message m LEFT JOIN FETCH m.replies r WHERE r.parentReply IS NULL ORDER BY m.ts DESC")
    List<Message> findAllWithRootReplies();
}