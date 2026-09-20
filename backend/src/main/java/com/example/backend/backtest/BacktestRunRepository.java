package com.example.backend.backtest;

import java.sql.Timestamp;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.ObjectMapper;

@Repository
public class BacktestRunRepository {
    private final JdbcTemplate jdbc;
    private final ObjectMapper json;

    public BacktestRunRepository(JdbcTemplate jdbc, ObjectMapper json) { this.jdbc = jdbc; this.json = json; }

    public void save(BacktestRun run) {
        jdbc.update("insert into backtest_runs (id, created_at, symbol, result_json) values (?, ?, ?, ?)",
                run.id().toString(), Timestamp.from(run.createdAt()), run.request().symbol(), json.writeValueAsString(run));
    }

    public Optional<BacktestRun> find(UUID id) {
        return jdbc.query("select result_json from backtest_runs where id = ?",
                (rs, index) -> json.readValue(rs.getString("result_json"), BacktestRun.class), id.toString()).stream().findFirst();
    }
}
