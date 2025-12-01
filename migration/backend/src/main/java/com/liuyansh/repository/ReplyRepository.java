package com.liuyansh.repository;
import com.liuyansh.entity.Reply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
@Repository
public interface ReplyRepository extends JpaRepository<Reply, UUID> {
    List<Reply> findByTsAfter(Instant timestamp);
}