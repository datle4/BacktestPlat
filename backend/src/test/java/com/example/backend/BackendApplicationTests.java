package com.example.backend;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class BackendApplicationTests {
    @Autowired JdbcTemplate jdbc;
    @Test void databaseConnectionWorks() {
        assertThat(jdbc.queryForObject("SELECT 1", Integer.class)).isEqualTo(1);
    }
}
